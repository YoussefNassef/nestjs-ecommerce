import { Injectable } from '@nestjs/common';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { CreateReviewProvider } from './create-review.provider';
import { FindProductReviewsProvider } from './find-product-reviews.provider';
import { RemoveReviewProvider } from './remove-review.provider';
import { UpdateReviewProvider } from './update-review.provider';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly createReviewProvider: CreateReviewProvider,
    private readonly findProductReviewsProvider: FindProductReviewsProvider,
    private readonly updateReviewProvider: UpdateReviewProvider,
    private readonly removeReviewProvider: RemoveReviewProvider,
  ) {}

  async createReview(userId: number, createReviewDto: CreateReviewDto) {
    return this.createReviewProvider.createReview(userId, createReviewDto);
  }

  async getProductReviews(
    productId: string,
    paginationQuery: PaginationQueryDto,
  ) {
    return this.findProductReviewsProvider.findProductReviews(
      productId,
      paginationQuery,
    );
  }

  async updateReview(
    user: ActiveUserData,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    return this.updateReviewProvider.updateReview(
      user,
      reviewId,
      updateReviewDto,
    );
  }

  async removeReview(user: ActiveUserData, reviewId: string) {
    return this.removeReviewProvider.removeReview(user, reviewId);
  }
}
