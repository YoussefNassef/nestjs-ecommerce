import { Injectable } from '@nestjs/common';
import { GetMyCartProvider } from './get-my-cart.provider';
import { CartStoreProvider } from './cart-store.provider';

@Injectable()
export class ClearCartProvider {
  constructor(
    private readonly getMyCartProvider: GetMyCartProvider,
    private readonly cartStoreProvider: CartStoreProvider,
  ) {}

  async clearCart(userId: number) {
    await this.cartStoreProvider.getStoredCartOrThrow(userId);
    await this.cartStoreProvider.saveStoredCart(userId, { items: [] });
    return this.getMyCartProvider.getMyCart(userId);
  }
}
