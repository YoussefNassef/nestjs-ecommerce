import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { UpdateDeliveryTrackingDto } from '../dtos/update-delivery-tracking.dto';
import { Order } from '../entities/orders.entity';
import { OrderItem } from '../entities/orders-item.entity';
import { OrderStatus } from '../enum/order.status.enum';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { toOrderResponseDto } from '../mappers/order-response.mapper';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { NotificationsService } from 'src/notifications/providers/notifications.service';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';
import { Product } from 'src/products/products.entity';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { OrderTrackingEvent } from '../entities/order-tracking-event.entity';
import { TrackingEventActorType } from '../enums/tracking-event-actor-type.enum';

@Injectable()
export class UpdateDeliveryTrackingProvider {
  private static readonly statusStep: Record<DeliveryStatus, number> = {
    [DeliveryStatus.PENDING]: 0,
    [DeliveryStatus.PROCESSING]: 1,
    [DeliveryStatus.SHIPPED]: 2,
    [DeliveryStatus.OUT_FOR_DELIVERY]: 3,
    [DeliveryStatus.DELIVERED]: 4,
    [DeliveryStatus.CANCELLED]: 99,
  };

  constructor(
    private readonly dataSource: DataSource,
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
    private readonly notificationsService: NotificationsService,
  ) {}

  async updateTracking(
    orderId: string,
    dto: UpdateDeliveryTrackingDto,
    actor: ActiveUserData,
  ): Promise<OrderResponseDto> {
    const now = new Date();
    let shouldSendMilestoneNotification = false;

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const productRepo = manager.getRepository(Product);
      const trackingEventRepo = manager.getRepository(OrderTrackingEvent);
      const order = await repo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      this.ensureValidTransition(order, dto.deliveryStatus);

      const nextStatus = dto.deliveryStatus;
      const hasTrackingNumber = Boolean(
        dto.trackingNumber ?? order.trackingNumber,
      );
      if (
        [DeliveryStatus.SHIPPED, DeliveryStatus.OUT_FOR_DELIVERY].includes(
          nextStatus,
        ) &&
        !hasTrackingNumber
      ) {
        throw new BadRequestException(
          'trackingNumber is required for shipped and out_for_delivery statuses',
        );
      }

      if (dto.trackingNumber !== undefined) {
        order.trackingNumber = dto.trackingNumber;
      }
      if (dto.shippingCarrier !== undefined) {
        order.shippingCarrier = dto.shippingCarrier;
      }
      if (dto.trackingUrl !== undefined) {
        order.trackingUrl = dto.trackingUrl;
      }
      if (dto.currentLocation !== undefined) {
        order.currentLocation = dto.currentLocation;
      }
      if (dto.trackingNote !== undefined) {
        order.trackingNote = dto.trackingNote;
      }
      if (dto.estimatedDeliveryAt !== undefined) {
        order.estimatedDeliveryAt = dto.estimatedDeliveryAt
          ? new Date(dto.estimatedDeliveryAt)
          : null;
      }

      if (order.deliveryStatus !== nextStatus) {
        shouldSendMilestoneNotification = [
          DeliveryStatus.SHIPPED,
          DeliveryStatus.OUT_FOR_DELIVERY,
          DeliveryStatus.DELIVERED,
        ].includes(nextStatus);
        order.deliveryStatus = nextStatus;
        order.deliveryStatusUpdatedAt = now;
      }

      if (
        [
          DeliveryStatus.SHIPPED,
          DeliveryStatus.OUT_FOR_DELIVERY,
          DeliveryStatus.DELIVERED,
        ].includes(nextStatus) &&
        !order.shippedAt
      ) {
        order.shippedAt = now;
      }

      if (
        [DeliveryStatus.OUT_FOR_DELIVERY, DeliveryStatus.DELIVERED].includes(
          nextStatus,
        ) &&
        !order.outForDeliveryAt
      ) {
        order.outForDeliveryAt = now;
      }

      if (nextStatus === DeliveryStatus.DELIVERED && !order.deliveredAt) {
        order.deliveredAt = now;
      }

      if (nextStatus === DeliveryStatus.CANCELLED) {
        if (order.stockReserved && order.status !== OrderStatus.PAID) {
          const orderItems = await orderItemRepo.find({
            where: { order: { id: order.id } },
            relations: ['product'],
          });

          for (const item of orderItems) {
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
        }

        order.status = OrderStatus.CANCELLED;
      } else if (
        nextStatus === DeliveryStatus.PROCESSING &&
        order.status === OrderStatus.PAID
      ) {
        order.status = OrderStatus.IN_PROGRESS;
      } else if (nextStatus === DeliveryStatus.DELIVERED) {
        order.status = OrderStatus.COMPLETED;
      }

      await repo.save(order);

      await trackingEventRepo.save({
        order: { id: order.id },
        deliveryStatus: order.deliveryStatus,
        trackingNumber: order.trackingNumber ?? null,
        shippingCarrier: order.shippingCarrier ?? null,
        trackingUrl: order.trackingUrl ?? null,
        currentLocation: order.currentLocation ?? null,
        trackingNote: order.trackingNote ?? null,
        eventAt: now,
        actorType: TrackingEventActorType.ADMIN,
        actorUserId: Number(actor.sub),
      });
    });

    const reloaded =
      await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);

    if (reloaded.user?.id && shouldSendMilestoneNotification) {
      await this.notificationsService.create({
        userId: reloaded.user.id,
        type: NotificationType.DELIVERY_UPDATED,
        title: 'تم تحديث حالة الشحنة',
        body: `تم تحديث حالة التوصيل إلى ${reloaded.deliveryStatus}.`,
        data: {
          orderId: reloaded.id,
          deliveryStatus: reloaded.deliveryStatus,
          trackingNumber: reloaded.trackingNumber ?? null,
          trackingUrl: reloaded.trackingUrl ?? null,
        },
      });
    }

    return toOrderResponseDto(reloaded);
  }

  private ensureValidTransition(
    order: Order,
    nextStatus: DeliveryStatus,
  ): void {
    if (
      order.status === OrderStatus.PENDING_PAYMENT ||
      order.status === OrderStatus.PAYMENT_INITIATED
    ) {
      if (
        ![DeliveryStatus.PENDING, DeliveryStatus.CANCELLED].includes(nextStatus)
      ) {
        throw new BadRequestException(
          'Cannot move delivery status before successful payment',
        );
      }
    }

    if (order.deliveryStatus === DeliveryStatus.CANCELLED) {
      throw new BadRequestException('Cancelled delivery cannot be updated');
    }

    if (order.deliveryStatus === DeliveryStatus.DELIVERED) {
      throw new BadRequestException('Delivered shipment cannot be updated');
    }

    if (nextStatus === DeliveryStatus.CANCELLED) {
      return;
    }

    const currentStep =
      UpdateDeliveryTrackingProvider.statusStep[order.deliveryStatus];
    const nextStep = UpdateDeliveryTrackingProvider.statusStep[nextStatus];
    if (nextStep < currentStep) {
      throw new BadRequestException(
        'Cannot move delivery status backward in timeline',
      );
    }
  }
}
