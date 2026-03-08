import { Injectable, NotFoundException } from '@nestjs/common';
import { BuildCartResponseProvider } from './build-cart-response.provider';
import { CartStoreProvider } from './cart-store.provider';

@Injectable()
export class GetMyCartProvider {
  constructor(
    private readonly cartStoreProvider: CartStoreProvider,
    private readonly buildCartResponseProvider: BuildCartResponseProvider,
  ) {}

  async getMyCart(userId: number) {
    const cart = await this.cartStoreProvider.getStoredCart(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return this.buildCartResponseProvider.buildCartResponse(userId, cart);
  }
}
