import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category.entity';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { RedisService } from 'src/redis/providers/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FindAllCategoryProvider {
  private readonly cacheTtlSeconds: number;

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtlSeconds =
      this.configService.get<number>('CATALOG_CACHE_TTL_SECONDS') ?? 60;
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Category>> {
    const page = paginationQuery.page;
    const limit = paginationQuery.limit;
    const cacheKey = `cache:categories:list:page=${page}:limit=${limit}`;

    const cached =
      await this.redisService.getJson<PaginatedResponse<Category>>(cacheKey);
    if (cached) {
      return cached;
    }

    const [items, totalItems] = await this.categoryRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    const payload: PaginatedResponse<Category> = {
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

    await this.redisService.setJson(cacheKey, payload, this.cacheTtlSeconds);
    return payload;
  }
}
