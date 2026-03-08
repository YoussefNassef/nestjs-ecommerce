import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Order } from '../entities/orders.entity';
import { OrderStatus } from '../enum/order.status.enum';
import { Product } from 'src/products/products.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

@Injectable()
export class ReleaseExpiredReservationsProvider {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  @Cron('*/1 * * * *')
  async cleanExpiredReservations(): Promise<void> {
    await this.releaseExpiredReservations();
  }

  async releaseExpiredReservations(): Promise<number> {
    const expiredOrders = await this.orderRepo.find({
      where: [
        {
          stockReserved: true,
          reservationExpiresAt: LessThan(new Date()),
          status: OrderStatus.PENDING_PAYMENT,
        },
        {
          stockReserved: true,
          reservationExpiresAt: LessThan(new Date()),
          status: OrderStatus.PAYMENT_INITIATED,
        },
      ],
      select: ['id'],
    });

    if (expiredOrders.length === 0) {
      return 0;
    }

    let releasedCount = 0;

    for (const expiredOrder of expiredOrders) {
      const released = await this.dataSource.transaction(async (manager) => {
        const orderRepo = manager.getRepository(Order);
        const productRepo = manager.getRepository(Product);

        const lockedOrder = await orderRepo.findOne({
          where: { id: expiredOrder.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lockedOrder) {
          return false;
        }

        const order = await orderRepo.findOne({
          where: { id: expiredOrder.id },
          relations: ['items', 'items.product'],
        });

        if (
          !order ||
          !order.stockReserved ||
          !order.reservationExpiresAt ||
          order.reservationExpiresAt > new Date() ||
          ![
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.PAYMENT_INITIATED,
          ].includes(order.status)
        ) {
          return false;
        }

        for (const item of order.items ?? []) {
          const product = await productRepo.findOne({
            where: { id: item.product.id },
            lock: { mode: 'pessimistic_write' },
          });

          if (!product) {
            continue;
          }

          product.stock += item.quantity;
          product.reservedStock = Math.max(
            0,
            (product.reservedStock ?? 0) - item.quantity,
          );
          await productRepo.save(product);
        }

        order.stockReserved = false;
        order.reservationExpiresAt = null;
        order.status = OrderStatus.CANCELLED;
        order.deliveryStatus = DeliveryStatus.CANCELLED;
        order.deliveryStatusUpdatedAt = new Date();
        await orderRepo.save(order);

        return true;
      });

      if (released) {
        releasedCount += 1;
      }
    }

    return releasedCount;
  }
}
