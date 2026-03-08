import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from '../wishlist.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GetMyWishlistProvider {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
  ) {}

  async getMyWishlist(userId: number) {
    return this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }
}
