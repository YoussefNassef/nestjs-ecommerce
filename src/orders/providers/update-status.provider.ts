import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../enum/order.status.enum';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/orders.entity';
import { Repository } from 'typeorm';
import { toOrderResponseDto } from '../mappers/order-response.mapper';
import { OrderResponseDto } from '../dtos/order-response.dto';

@Injectable()
export class UpdateStatusProvider {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
  ) {}
  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderResponseDto> {
    const order =
      await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);
    order.status = status;
    const updated = await this.orderRepo.save(order);
    return toOrderResponseDto(updated);
  }
}
