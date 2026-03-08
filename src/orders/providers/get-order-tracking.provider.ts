import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from 'src/auth/enums/role.enum';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { DeliveryTrackingResponseDto } from '../dtos/delivery-tracking-response.dto';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';

@Injectable()
export class GetOrderTrackingProvider {
  constructor(
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
  ) {}

  async getTracking(
    orderId: string,
    user: ActiveUserData,
  ): Promise<DeliveryTrackingResponseDto> {
    const order =
      await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);

    const isOwner = order.user?.id === user.sub;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to access this order');
    }

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
    };
  }
}
