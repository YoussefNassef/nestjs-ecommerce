import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/products.entity';
import { Repository } from 'typeorm';
import { Review } from '../review.entity';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';

@Injectable()
export class FindProductReviewsProvider {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findProductReviews(
    productId: string,
    paginationQuery: PaginationQueryDto,
  ) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const page = paginationQuery.page;
    const limit = paginationQuery.limit;

    const [reviews, totalItems] = await this.reviewRepo.findAndCount({
      where: { product: { id: productId } },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    const stats = await this.reviewRepo
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('review.productId = :productId', { productId })
      .getRawOne<{ totalReviews: string; averageRating: string | null }>();

    const totalReviews = Number(stats?.totalReviews ?? 0);
    const averageRating =
      totalReviews === 0
        ? 0
        : Number(Number(stats?.averageRating ?? 0).toFixed(2));

    return {
      productId,
      totalReviews,
      averageRating,
      reviews,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      } as PaginatedResponse<Review>['meta'],
    };
  }
}
