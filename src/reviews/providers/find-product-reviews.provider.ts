import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/products.entity';
import { Repository } from 'typeorm';
import { Review } from '../review.entity';

@Injectable()
export class FindProductReviewsProvider {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findProductReviews(productId: string) {
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await this.reviewRepo.find({
      where: { product: { id: productId } },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews === 0
        ? 0
        : Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              totalReviews
            ).toFixed(2),
          );

    return {
      productId,
      totalReviews,
      averageRating,
      reviews,
    };
  }
}
