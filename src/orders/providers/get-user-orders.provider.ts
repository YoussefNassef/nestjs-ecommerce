import { Injectable } from '@nestjs/common';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/orders.entity';
import { Repository } from 'typeorm';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { toOrderResponseDto } from '../mappers/order-response.mapper';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';

@Injectable()
export class GetUserOrdersProvider {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}
  async getUserOrders(
    user: ActiveUserData,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<OrderResponseDto>> {
    const page = paginationQuery.page;
    const limit = paginationQuery.limit;
    const [orders, totalItems] = await this.orderRepo.findAndCount({
      where: { user: { id: user.sub } },
      relations: ['items', 'items.product', 'payment'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
      items: orders.map((order) => toOrderResponseDto(order)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
