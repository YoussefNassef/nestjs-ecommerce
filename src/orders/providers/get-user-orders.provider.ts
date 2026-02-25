import { Injectable } from '@nestjs/common';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/orders.entity';
import { Repository } from 'typeorm';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { toOrderResponseDto } from '../mappers/order-response.mapper';

@Injectable()
export class GetUserOrdersProvider {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}
  async getUserOrders(user: ActiveUserData): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepo.find({
      where: { user: { id: user.sub } },
      relations: ['items', 'items.product', 'payment'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => toOrderResponseDto(order));
  }
}
