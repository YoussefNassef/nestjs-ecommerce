import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from '../wishlist.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RemoveFromWishlistProvider {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
  ) {}

  async removeFromWishlist(userId: number, productId: string) {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.wishlistRepository.remove(wishlistItem);
    return { message: 'Wishlist item removed successfully' };
  }
}
