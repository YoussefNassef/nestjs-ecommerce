import { Injectable, NotFoundException } from '@nestjs/common';
import { CartService } from 'src/cart/providers/cart.service';
import { RemoveFromWishlistProvider } from './remove-from-wishlist.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from '../wishlist.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MoveToCartProvider {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    private readonly cartService: CartService,
    private readonly removeFromWishlistProvider: RemoveFromWishlistProvider,
  ) {}

  async moveToCart(userId: number, productId: string) {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.cartService.addToCart(userId, { productId, quantity: 1 });
    await this.removeFromWishlistProvider.removeFromWishlist(userId, productId);

    return { message: 'Product moved from wishlist to cart' };
  }
}
