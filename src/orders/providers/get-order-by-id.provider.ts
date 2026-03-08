import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from 'src/auth/enums/role.enum';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { toOrderResponseDto } from '../mappers/order-response.mapper';

@Injectable()
export class GetOrderByIdProvider {
  constructor(
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
  ) {}
  async getOrderById(orderId: string, user: ActiveUserData) {
    const order =
      await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);

    const isOwner = Number(order.user?.id) === Number(user.sub);
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to access this order');
    }

    return toOrderResponseDto(order);
  }
}
