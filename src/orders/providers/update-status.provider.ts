import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../enum/order.status.enum';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/orders.entity';
import { DataSource, Repository } from 'typeorm';
import { toOrderResponseDto } from '../mappers/order-response.mapper';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { Product } from 'src/products/products.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { NotificationsService } from 'src/notifications/providers/notifications.service';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';

@Injectable()
export class UpdateStatusProvider {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}
  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderResponseDto> {
    const currentOrder =
      await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);

    if (currentOrder.status === status) {
      return toOrderResponseDto(currentOrder);
    }

    const updated = await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const productRepo = manager.getRepository(Product);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        return currentOrder;
      }

      const orderWithItems = await orderRepo.findOne({
        where: { id: orderId },
        relations: ['items', 'items.product', 'user'],
      });

      if (!orderWithItems) {
        return currentOrder;
      }

      const shouldReleaseReservation =
        status === OrderStatus.CANCELLED &&
        orderWithItems.stockReserved &&
        order.status !== OrderStatus.PAID;

      if (shouldReleaseReservation) {
        for (const item of orderWithItems.items ?? []) {
          const product = await productRepo.findOne({
            where: { id: item.product.id },
            lock: { mode: 'pessimistic_write' },
          });

          if (product) {
            product.stock += item.quantity;
            product.reservedStock = Math.max(
              0,
              (product.reservedStock ?? 0) - item.quantity,
            );
            await productRepo.save(product);
          }
        }

        orderWithItems.stockReserved = false;
        orderWithItems.reservationExpiresAt = null;
        orderWithItems.deliveryStatus = DeliveryStatus.CANCELLED;
        orderWithItems.deliveryStatusUpdatedAt = new Date();
      }

      if (status === OrderStatus.PAID) {
        if (orderWithItems.stockReserved) {
          for (const item of orderWithItems.items ?? []) {
            const product = await productRepo.findOne({
              where: { id: item.product.id },
              lock: { mode: 'pessimistic_write' },
            });

            if (product) {
              product.reservedStock = Math.max(
                0,
                (product.reservedStock ?? 0) - item.quantity,
              );
              await productRepo.save(product);
            }
          }
        }

        // Reservation is consumed after successful payment.
        orderWithItems.stockReserved = false;
        orderWithItems.reservationExpiresAt = null;
        if (orderWithItems.deliveryStatus === DeliveryStatus.PENDING) {
          orderWithItems.deliveryStatus = DeliveryStatus.PROCESSING;
          orderWithItems.deliveryStatusUpdatedAt = new Date();
        }
      }

      orderWithItems.status = status;
      return orderRepo.save(orderWithItems);
    });

    const notification = this.buildStatusNotification(updated);
    if (notification) {
      await this.notificationsService.create(notification);
    }
    const adminNotification = this.buildAdminStatusNotification(updated);
    if (adminNotification) {
      await this.notificationsService.createForAdmins(adminNotification);
    }

    return toOrderResponseDto(updated);
  }

  private buildStatusNotification(order: Order):
    | {
        userId: number;
        type: NotificationType;
        title: string;
        body: string;
        data: Record<string, unknown>;
      }
    | null {
    if (!order.user?.id) {
      return null;
    }

    const baseData = {
      orderId: order.id,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
    };

    switch (order.status) {
      case OrderStatus.PAID:
        return {
          userId: order.user.id,
          type: NotificationType.ORDER_PAID,
          title: 'تم تأكيد الدفع',
          body: 'تم استلام دفعتك بنجاح وبدأ تجهيز الطلب.',
          data: baseData,
        };
      case OrderStatus.CANCELLED:
        return {
          userId: order.user.id,
          type: NotificationType.ORDER_CANCELLED,
          title: 'تم إلغاء الطلب',
          body: 'تم إلغاء الطلب وتحرير أي مخزون كان محجوزًا له.',
          data: baseData,
        };
      case OrderStatus.IN_PROGRESS:
        return {
          userId: order.user.id,
          type: NotificationType.ORDER_IN_PROGRESS,
          title: 'الطلب قيد التجهيز',
          body: 'طلبك دخل مرحلة التنفيذ والتجهيز للشحن.',
          data: baseData,
        };
      case OrderStatus.COMPLETED:
        return {
          userId: order.user.id,
          type: NotificationType.ORDER_COMPLETED,
          title: 'تم اكتمال الطلب',
          body: 'تم تسليم طلبك بنجاح.',
          data: baseData,
        };
      default:
        return null;
    }
  }

  private buildAdminStatusNotification(order: Order):
    | {
        type: NotificationType;
        title: string;
        body: string;
        data: Record<string, unknown>;
      }
    | null {
    const baseData = {
      orderId: order.id,
      userId: order.user?.id ?? null,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
    };

    switch (order.status) {
      case OrderStatus.PAID:
        return {
          type: NotificationType.ORDER_PAID,
          title: 'Payment confirmed',
          body: `Customer payment for order ${order.id} was confirmed.`,
          data: baseData,
        };
      case OrderStatus.CANCELLED:
        return {
          type: NotificationType.ORDER_CANCELLED,
          title: 'Order cancelled',
          body: `Order ${order.id} was cancelled.`,
          data: baseData,
        };
      case OrderStatus.COMPLETED:
        return {
          type: NotificationType.ORDER_COMPLETED,
          title: 'Order completed',
          body: `Order ${order.id} was completed successfully.`,
          data: baseData,
        };
      default:
        return null;
    }
  }
}
