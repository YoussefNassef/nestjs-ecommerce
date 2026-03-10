import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductStockMovement } from '../product-stock-movement.entity';
import { Repository } from 'typeorm';
import { ListProductStockMovementsQueryDto } from '../dtos/list-product-stock-movements-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';

@Injectable()
export class ListStockMovementsProvider {
  constructor(
    @InjectRepository(ProductStockMovement)
    private readonly movementRepo: Repository<ProductStockMovement>,
  ) {}

  async list(
    productId: string,
    query: ListProductStockMovementsQueryDto,
  ): Promise<PaginatedResponse<ProductStockMovement>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.movementRepo
      .createQueryBuilder('movement')
      .where('movement.productId = :productId', { productId })
      .orderBy('movement.createdAt', 'DESC')
      .addOrderBy('movement.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.reason) {
      qb.andWhere('movement.reason = :reason', { reason: query.reason });
    }

    const [data, total] = await qb.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items: data,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
