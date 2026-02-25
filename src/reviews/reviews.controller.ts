import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import * as activeUserDataInterface from 'src/auth/interface/active-user-data.interface';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { Review } from './review.entity';
import { ReviewsService } from './providers/reviews.service';

@ApiTags('reviews')
@ApiBearerAuth('JWT-auth')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Create review for product' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Review created', type: Review })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'User already reviewed this product',
  })
  createReview(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.sub, createReviewDto);
  }

  @Get('product/:productId')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Product reviews retrieved' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @Patch(':reviewId')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Update review' })
  @ApiParam({
    name: 'reviewId',
    description: 'Review UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, description: 'Review updated', type: Review })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  updateReview(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(user, reviewId, updateReviewDto);
  }

  @Delete(':reviewId')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Delete review' })
  @ApiParam({
    name: 'reviewId',
    description: 'Review UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  removeReview(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewsService.removeReview(user, reviewId);
  }
}
