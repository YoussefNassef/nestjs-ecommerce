import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { OrderStatus } from '../enum/order.status.enum';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { UpdateStatusProvider } from './update-status.provider';
import { toOrderResponseDto } from '../mappers/order-response.mapper';

@Injectable()
export class CancelMyOrderProvider {
  constructor(
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
    private readonly updateStatusProvider: UpdateStatusProvider,
  ) {}

  async cancel(
    orderId: string,
    user: ActiveUserData,
  ): Promise<OrderResponseDto> {
    const order =
      await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);

    if (Number(order.user?.id) !== Number(user.sub)) {
      throw new ForbiddenException('You are not allowed to cancel this order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      return toOrderResponseDto(order);
    }

    if (
      order.deliveryStatus === DeliveryStatus.OUT_FOR_DELIVERY ||
      order.deliveryStatus === DeliveryStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Out-for-delivery or delivered orders cannot be cancelled',
      );
    }

    if (
      ![
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PAYMENT_INITIATED,
        OrderStatus.PAID,
        OrderStatus.IN_PROGRESS,
      ].includes(order.status)
    ) {
      throw new BadRequestException(
        'Order cannot be cancelled in the current status',
      );
    }

    return this.updateStatusProvider.updateStatus(
      orderId,
      OrderStatus.CANCELLED,
    );
  }
}
