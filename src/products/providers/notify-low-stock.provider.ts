import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { NotificationsService } from 'src/notifications/providers/notifications.service';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';
import { RedisService } from 'src/redis/providers/redis.service';

export interface LowStockAlertSummary {
  threshold: number;
  totalLowStockProducts: number;
  notificationsCreated: number;
  skippedByCooldown: boolean;
}

@Injectable()
export class NotifyLowStockProvider {
  private readonly logger = new Logger(NotifyLowStockProvider.name);
  private readonly cooldownCacheKey = 'alerts:low-stock:last-notified-at';

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly notificationsService: NotificationsService,
    private readonly redisService: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async notifyByCron(): Promise<void> {
    try {
      const summary = await this.notifyLowStock(false);
      if (summary.totalLowStockProducts > 0) {
        this.logger.log(
          `Low-stock check threshold=${summary.threshold} total=${summary.totalLowStockProducts} notified=${summary.notificationsCreated} skippedByCooldown=${summary.skippedByCooldown}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Low-stock notification job failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async notifyLowStock(force = false): Promise<LowStockAlertSummary> {
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
    const cooldownMinutes = Number(
      process.env.LOW_STOCK_ALERT_COOLDOWN_MINUTES ?? 120,
    );

    const lowStockProducts = await this.productRepo.find({
      where: {
        isActive: true,
        stock: LessThanOrEqual(threshold),
      },
      select: ['id', 'name', 'sku', 'stock'],
      order: { stock: 'ASC' },
      take: 20,
    });

    if (lowStockProducts.length === 0) {
      return {
        threshold,
        totalLowStockProducts: 0,
        notificationsCreated: 0,
        skippedByCooldown: false,
      };
    }

    if (!force) {
      const lastNotifiedAt =
        await this.redisService.getJson<string>(this.cooldownCacheKey);
      if (lastNotifiedAt) {
        return {
          threshold,
          totalLowStockProducts: lowStockProducts.length,
          notificationsCreated: 0,
          skippedByCooldown: true,
        };
      }
    }

    const itemsPreview = lowStockProducts
      .slice(0, 5)
      .map((p) => `${p.name ?? p.sku ?? p.id} (${p.stock})`)
      .join(', ');

    const notificationsCreated = await this.notificationsService.createForAdmins(
      {
        type: NotificationType.LOW_STOCK_ALERT,
        title: 'Low stock alert',
        body: `There are ${lowStockProducts.length} product(s) at or below stock ${threshold}. ${itemsPreview}`,
        data: {
          threshold,
          count: lowStockProducts.length,
          products: lowStockProducts.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            stock: p.stock,
          })),
        },
      },
    );

    await this.redisService.setJson(
      this.cooldownCacheKey,
      new Date().toISOString(),
      Math.max(1, cooldownMinutes * 60),
    );

    return {
      threshold,
      totalLowStockProducts: lowStockProducts.length,
      notificationsCreated,
      skippedByCooldown: false,
    };
  }
}
