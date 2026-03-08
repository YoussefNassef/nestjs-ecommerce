import { Injectable } from '@nestjs/common';
import { AddToWishlistProvider } from './add-to-wishlist.provider';
import { GetMyWishlistProvider } from './get-my-wishlist.provider';
import { RemoveFromWishlistProvider } from './remove-from-wishlist.provider';
import { MoveToCartProvider } from './move-to-cart.provider';

@Injectable()
export class WishlistService {
  constructor(
    private readonly addToWishlistProvider: AddToWishlistProvider,
    private readonly getMyWishlistProvider: GetMyWishlistProvider,
    private readonly removeFromWishlistProvider: RemoveFromWishlistProvider,
    private readonly moveToCartProvider: MoveToCartProvider,
  ) {}

  async addToWishlist(userId: number, productId: string) {
    return this.addToWishlistProvider.addToWishlist(userId, productId);
  }

  async getMyWishlist(userId: number) {
    return this.getMyWishlistProvider.getMyWishlist(userId);
  }

  async removeFromWishlist(userId: number, productId: string) {
    return this.removeFromWishlistProvider.removeFromWishlist(userId, productId);
  }

  async moveToCart(userId: number, productId: string) {
    return this.moveToCartProvider.moveToCart(userId, productId);
  }
}
