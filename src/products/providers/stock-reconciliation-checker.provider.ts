import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products.entity';
import { DataSource, Repository } from 'typeorm';
import { NotificationsService } from 'src/notifications/providers/notifications.service';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';
import { RedisService } from 'src/redis/providers/redis.service';

export interface InventoryAnomaly {
  type:
    | 'negative_stock'
    | 'negative_reserved_stock'
    | 'reserved_stock_mismatch';
  productId: string;
  productName: string | null;
  sku: string | null;
  stock: number;
  reservedStock: number;
  expectedReservedStock?: number;
  difference?: number;
}

export interface StockReconciliationResult {
  checkedProducts: number;
  anomaliesCount: number;
  generatedAt: string;
  anomalies: InventoryAnomaly[];
  notificationsCreated?: number;
  notificationSkippedByCooldown?: boolean;
}

export interface ReservedStockFixItem {
  productId: string;
  productName: string | null;
  sku: string | null;
  beforeReservedStock: number;
  expectedReservedStock: number;
  afterReservedStock: number;
}

export interface StockReconciliationFixResult {
  dryRun: boolean;
  generatedAt: string;
  fixedCount: number;
  candidatesCount: number;
  fixedItems: ReservedStockFixItem[];
}

@Injectable()
export class StockReconciliationCheckerProvider {
  private readonly logger = new Logger(StockReconciliationCheckerProvider.name);
  private readonly notificationCooldownKey =
    'alerts:inventory-anomaly:last-notified-at';

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly notificationsService: NotificationsService,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runByCron(): Promise<void> {
    try {
      const result = await this.runCheck(true, false);
      if (result.anomaliesCount > 0) {
        this.logger.warn(
          `Inventory anomalies detected: ${result.anomaliesCount}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Inventory reconciliation job failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async runCheck(
    notifyAdmins = false,
    forceNotify = false,
  ): Promise<StockReconciliationResult> {
    const { products, anomalies } = await this.collectInventoryState();

    const result: StockReconciliationResult = {
      checkedProducts: products.length,
      anomaliesCount: anomalies.length,
      generatedAt: new Date().toISOString(),
      anomalies,
      notificationsCreated: 0,
      notificationSkippedByCooldown: false,
    };

    if (!notifyAdmins || anomalies.length === 0) {
      return result;
    }

    const cooldownMinutes = Number(
      process.env.INVENTORY_RECONCILIATION_ALERT_COOLDOWN_MINUTES ?? 120,
    );

    if (!forceNotify) {
      const cooldownState = await this.redisService.getJson<string>(
        this.notificationCooldownKey,
      );
      if (cooldownState) {
        result.notificationSkippedByCooldown = true;
        return result;
      }
    }

    const preview = anomalies
      .slice(0, 5)
      .map((item) => `${item.productName ?? item.sku ?? item.productId} (${item.type})`)
      .join(', ');

    const notificationsCreated = await this.notificationsService.createForAdmins(
      {
        type: NotificationType.INVENTORY_ANOMALY,
        title: 'Inventory reconciliation anomaly',
        body: `Detected ${anomalies.length} inventory anomaly/anomalies. ${preview}`,
        data: {
          generatedAt: result.generatedAt,
          checkedProducts: result.checkedProducts,
          anomaliesCount: anomalies.length,
          anomalies: anomalies.slice(0, 50),
        },
      },
    );

    await this.redisService.setJson(
      this.notificationCooldownKey,
      result.generatedAt,
      Math.max(1, cooldownMinutes * 60),
    );

    result.notificationsCreated = notificationsCreated;
    return result;
  }

  async fixReservedStockMismatch(
    dryRun = true,
    forceNotify = false,
  ): Promise<StockReconciliationFixResult> {
    const state = await this.collectInventoryState();
    const mismatches = state.anomalies
      .filter((item) => item.type === 'reserved_stock_mismatch')
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        beforeReservedStock: item.reservedStock,
        expectedReservedStock: Number(item.expectedReservedStock ?? 0),
      }));

    if (dryRun || mismatches.length === 0) {
      return {
        dryRun: true,
        generatedAt: new Date().toISOString(),
        fixedCount: 0,
        candidatesCount: mismatches.length,
        fixedItems: mismatches.map((item) => ({
          ...item,
          afterReservedStock: item.beforeReservedStock,
        })),
      };
    }

    const fixedItems: ReservedStockFixItem[] = await this.dataSource.transaction(
      async (manager) => {
        const productRepo = manager.getRepository(Product);

        const expectedRows = await manager
          .createQueryBuilder()
          .select('item.productId', 'productId')
          .addSelect('COALESCE(SUM(item.quantity), 0)', 'expectedReservedStock')
          .from('order_items', 'item')
          .innerJoin('orders', 'ord', 'ord.id = item.orderId')
          .where('ord.stockReserved = true')
          .groupBy('item.productId')
          .getRawMany<{ productId: string; expectedReservedStock: string }>();
        const expectedByProduct = new Map<string, number>(
          expectedRows.map((row) => [
            row.productId,
            Number(row.expectedReservedStock ?? 0),
          ]),
        );

        const sortedProductIds = [...new Set(mismatches.map((m) => m.productId))].sort();
        const updated: ReservedStockFixItem[] = [];

        for (const productId of sortedProductIds) {
          const product = await productRepo.findOne({
            where: { id: productId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!product) {
            continue;
          }

          const beforeReservedStock = Number(product.reservedStock ?? 0);
          const expectedReservedStock = Number(
            expectedByProduct.get(product.id) ?? 0,
          );

          if (beforeReservedStock === expectedReservedStock) {
            continue;
          }

          product.reservedStock = expectedReservedStock;
          await productRepo.save(product);

          updated.push({
            productId: product.id,
            productName: product.name ?? null,
            sku: product.sku ?? null,
            beforeReservedStock,
            expectedReservedStock,
            afterReservedStock: expectedReservedStock,
          });
        }

        return updated;
      },
    );

    if (fixedItems.length > 0) {
      const cooldownMinutes = Number(
        process.env.INVENTORY_RECONCILIATION_ALERT_COOLDOWN_MINUTES ?? 120,
      );

      const shouldNotify =
        forceNotify ||
        !(await this.redisService.getJson<string>(this.notificationCooldownKey));

      if (shouldNotify) {
        await this.notificationsService.createForAdmins({
          type: NotificationType.INVENTORY_ANOMALY,
          title: 'Inventory reconciliation auto-fix executed',
          body: `Auto-fix updated reserved stock for ${fixedItems.length} product(s).`,
          data: {
            fixedAt: new Date().toISOString(),
            fixedCount: fixedItems.length,
            fixedItems: fixedItems.slice(0, 50),
          },
        });
        await this.redisService.setJson(
          this.notificationCooldownKey,
          new Date().toISOString(),
          Math.max(1, cooldownMinutes * 60),
        );
      }
    }

    return {
      dryRun: false,
      generatedAt: new Date().toISOString(),
      fixedCount: fixedItems.length,
      candidatesCount: mismatches.length,
      fixedItems,
    };
  }

  private async collectInventoryState(): Promise<{
    products: Product[];
    anomalies: InventoryAnomaly[];
  }> {
    const products = await this.productRepo.find({
      select: ['id', 'name', 'sku', 'stock', 'reservedStock'],
    });

    const expectedReservedRows = await this.productRepo.manager
      .createQueryBuilder()
      .select('item.productId', 'productId')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'expectedReservedStock')
      .from('order_items', 'item')
      .innerJoin('orders', 'ord', 'ord.id = item.orderId')
      .where('ord.stockReserved = true')
      .groupBy('item.productId')
      .getRawMany<{ productId: string; expectedReservedStock: string }>();

    const expectedByProduct = new Map<string, number>(
      expectedReservedRows.map((row) => [
        row.productId,
        Number(row.expectedReservedStock ?? 0),
      ]),
    );

    const anomalies: InventoryAnomaly[] = [];
    for (const product of products) {
      const stock = Number(product.stock ?? 0);
      const reserved = Number(product.reservedStock ?? 0);
      const expectedReserved = expectedByProduct.get(product.id) ?? 0;

      if (stock < 0) {
        anomalies.push({
          type: 'negative_stock',
          productId: product.id,
          productName: product.name ?? null,
          sku: product.sku ?? null,
          stock,
          reservedStock: reserved,
        });
      }

      if (reserved < 0) {
        anomalies.push({
          type: 'negative_reserved_stock',
          productId: product.id,
          productName: product.name ?? null,
          sku: product.sku ?? null,
          stock,
          reservedStock: reserved,
        });
      }

      if (reserved !== expectedReserved) {
        anomalies.push({
          type: 'reserved_stock_mismatch',
          productId: product.id,
          productName: product.name ?? null,
          sku: product.sku ?? null,
          stock,
          reservedStock: reserved,
          expectedReservedStock: expectedReserved,
          difference: reserved - expectedReserved,
        });
      }
    }

    return { products, anomalies };
  }
}
