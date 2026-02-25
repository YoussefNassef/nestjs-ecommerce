import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/products.entity';
import { Review } from './review.entity';
import { ReviewsController } from './reviews.controller';
import { CreateReviewProvider } from './providers/create-review.provider';
import { FindProductReviewsProvider } from './providers/find-product-reviews.provider';
import { RemoveReviewProvider } from './providers/remove-review.provider';
import { ReviewsService } from './providers/reviews.service';
import { UpdateReviewProvider } from './providers/update-review.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Product])],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    CreateReviewProvider,
    FindProductReviewsProvider,
    UpdateReviewProvider,
    RemoveReviewProvider,
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}
