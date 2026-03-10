import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Product } from '../products.entity';
import { ProductStockMovement } from '../product-stock-movement.entity';
import { AdjustProductStockDto } from '../dtos/adjust-product-stock.dto';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { RedisService } from 'src/redis/providers/redis.service';
import { StockAdjustmentReason } from '../enums/stock-adjustment-reason.enum';

@Injectable()
export class AdjustStockProvider {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  async adjustStock(
    productId: string,
    dto: AdjustProductStockDto,
    admin: ActiveUserData,
  ) {
    const updatedProduct = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const movementRepo = manager.getRepository(ProductStockMovement);

      const product = await productRepo.findOne({
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const previousStock = product.stock ?? 0;
      const newStock = previousStock + dto.delta;
      if (newStock < 0) {
        throw new BadRequestException(
          `Stock cannot go below zero. current=${previousStock}, delta=${dto.delta}`,
        );
      }

      product.stock = newStock;
      const savedProduct = await productRepo.save(product);

      const movement = movementRepo.create({
        productId,
        previousStock,
        delta: dto.delta,
        newStock,
        reason: dto.reason ?? StockAdjustmentReason.MANUAL,
        reference: dto.reference?.trim() || null,
        note: dto.note?.trim() || null,
        createdByAdminUserId: admin.sub,
      });
      await movementRepo.save(movement);
      return savedProduct;
    });

    await this.redisService.deleteByPattern('cache:products:list:*');
    return updatedProduct;
  }
}
