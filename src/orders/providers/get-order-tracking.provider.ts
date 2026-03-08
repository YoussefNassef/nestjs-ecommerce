import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from 'src/auth/enums/role.enum';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { DeliveryTrackingResponseDto } from '../dtos/delivery-tracking-response.dto';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderTrackingEvent } from '../entities/order-tracking-event.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GetOrderTrackingProvider {
  constructor(
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
    @InjectRepository(OrderTrackingEvent)
    private readonly orderTrackingEventRepo: Repository<OrderTrackingEvent>,
  ) {}

  async getTracking(
    orderId: string,
    user: ActiveUserData,
  ): Promise<DeliveryTrackingResponseDto> {
    const order =
      await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);

    const isOwner = Number(order.user?.id) === Number(user.sub);
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to access this order');
    }

    const timeline = await this.orderTrackingEventRepo.find({
      where: { order: { id: order.id } },
      order: { eventAt: 'ASC', createdAt: 'ASC' },
    });

    return {
      orderId: order.id,
      deliveryStatus: order.deliveryStatus,
      trackingNumber: order.trackingNumber ?? null,
      shippingCarrier: order.shippingCarrier ?? null,
      trackingUrl: order.trackingUrl ?? null,
      currentLocation: order.currentLocation ?? null,
      trackingNote: order.trackingNote ?? null,
      estimatedDeliveryAt: order.estimatedDeliveryAt ?? null,
      shippedAt: order.shippedAt ?? null,
      outForDeliveryAt: order.outForDeliveryAt ?? null,
      deliveredAt: order.deliveredAt ?? null,
      deliveryStatusUpdatedAt: order.deliveryStatusUpdatedAt ?? null,
      timeline: timeline.map((event) => ({
        id: event.id,
        deliveryStatus: event.deliveryStatus,
        trackingNumber: event.trackingNumber ?? null,
        shippingCarrier: event.shippingCarrier ?? null,
        trackingUrl: event.trackingUrl ?? null,
        currentLocation: event.currentLocation ?? null,
        trackingNote: event.trackingNote ?? null,
        eventAt: event.eventAt,
        actorType: event.actorType,
        actorUserId: event.actorUserId ?? null,
      })),
    };
  }
}
