import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products.entity';
import { Repository } from 'typeorm';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { RedisService } from 'src/redis/providers/redis.service';
import { ConfigService } from '@nestjs/config';
import {
  ProductListQueryDto,
  ProductSortBy,
  SortOrder,
} from '../dtos/product-list-query.dto';

@Injectable()
export class FindAllProvider {
  private readonly cacheTtlSeconds: number;

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtlSeconds =
      this.configService.get<number>('CATALOG_CACHE_TTL_SECONDS') ?? 60;
  }

  async findAll(
    query: ProductListQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    const {
      page,
      limit,
      search,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      isActive,
      sortBy = ProductSortBy.NAME,
      sortOrder = SortOrder.ASC,
    } = query;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException(
        'minPrice must be less than or equal maxPrice',
      );
    }

    const normalized = {
      page,
      limit,
      search: search?.trim().toLowerCase() || null,
      categoryId: categoryId ?? null,
      categorySlug: categorySlug?.trim().toLowerCase() || null,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
      isActive: isActive ?? null,
      sortBy,
      sortOrder,
    };
    const cacheKey = `cache:products:list:${JSON.stringify(normalized)}`;

    const cached =
      await this.redisService.getJson<PaginatedResponse<Product>>(cacheKey);
    if (cached) {
      return cached;
    }

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (normalized.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.slug ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${normalized.search}%` },
      );
    }

    if (normalized.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: normalized.categoryId,
      });
    }

    if (normalized.categorySlug) {
      qb.andWhere('category.slug = :categorySlug', {
        categorySlug: normalized.categorySlug,
      });
    }

    if (normalized.minPrice !== null) {
      qb.andWhere('product.price >= :minPrice', {
        minPrice: normalized.minPrice,
      });
    }

    if (normalized.maxPrice !== null) {
      qb.andWhere('product.price <= :maxPrice', {
        maxPrice: normalized.maxPrice,
      });
    }

    if (normalized.isActive !== null) {
      qb.andWhere('product.isActive = :isActive', {
        isActive: normalized.isActive,
      });
    }

    const sortColumnMap: Record<ProductSortBy, string> = {
      [ProductSortBy.NAME]: 'product.name',
      [ProductSortBy.PRICE]: 'product.price',
      [ProductSortBy.STOCK]: 'product.stock',
    };

    qb.orderBy(
      sortColumnMap[normalized.sortBy],
      normalized.sortOrder.toUpperCase() as 'ASC' | 'DESC',
    )
      .addOrderBy('product.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, totalItems] = await qb.getManyAndCount();
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    const payload: PaginatedResponse<Product> = {
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
