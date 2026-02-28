import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products.entity';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';

@Injectable()
export class FindAllProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    const page = paginationQuery.page;
    const limit = paginationQuery.limit;
    const [items, totalItems] = await this.productRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        name: 'ASC',
      },
    });
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
      items,
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
