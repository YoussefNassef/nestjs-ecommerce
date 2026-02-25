import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/auth/enums/role.enum';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { Repository } from 'typeorm';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { Review } from '../review.entity';

@Injectable()
export class UpdateReviewProvider {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async updateReview(
    user: ActiveUserData,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
      relations: {
        user: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const isOwner = review.user.id === user.sub;
    const isAdmin = user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You cannot update this review');
    }

    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }

    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }

    return this.reviewRepo.save(review);
  }
}
