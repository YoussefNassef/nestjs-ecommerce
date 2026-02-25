import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/auth/enums/role.enum';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { Repository } from 'typeorm';
import { Review } from '../review.entity';

@Injectable()
export class RemoveReviewProvider {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async removeReview(user: ActiveUserData, reviewId: string) {
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
      throw new ForbiddenException('You cannot delete this review');
    }

    await this.reviewRepo.remove(review);

    return { message: 'Review deleted successfully' };
  }
}
