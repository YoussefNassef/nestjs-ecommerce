import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/products.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { Review } from '../review.entity';

@Injectable()
export class CreateReviewProvider {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async createReview(userId: number, createReviewDto: CreateReviewDto) {
    const product = await this.productRepo.findOne({
      where: { id: createReviewDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingReview = await this.reviewRepo.findOne({
      where: {
        user: { id: userId },
        product: { id: createReviewDto.productId },
      },
      relations: {
        user: true,
        product: true,
      },
    });

    if (existingReview) {
      throw new ConflictException('You already reviewed this product');
    }

    const review = this.reviewRepo.create({
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      user: { id: userId },
      product,
    });

    return this.reviewRepo.save(review);
  }
}
