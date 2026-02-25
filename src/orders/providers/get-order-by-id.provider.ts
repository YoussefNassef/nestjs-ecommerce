import { Injectable } from '@nestjs/common';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { toOrderResponseDto } from '../mappers/order-response.mapper';

@Injectable()
export class GetOrderByIdProvider {
  constructor(
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
  ) {}
  async getOrderById(orderId: string) {
    const order =
      await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);
    return toOrderResponseDto(order);
  }
}
