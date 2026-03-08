import { Injectable, NotFoundException } from '@nestjs/common';
import { GetMyCartProvider } from './get-my-cart.provider';
import { CartStoreProvider } from './cart-store.provider';

@Injectable()
export class RemoveFromCartProvider {
  constructor(
    private readonly getMyCartProvider: GetMyCartProvider,
    private readonly cartStoreProvider: CartStoreProvider,
  ) {}

  async removeFromCart(userId: number, cartItemId: string) {
    const cart = await this.cartStoreProvider.getStoredCartOrThrow(userId);
    const itemIndex = cart.items.findIndex((item) => item.id === cartItemId);

    if (itemIndex === -1) {
      throw new NotFoundException('Cart item not found');
    }

    cart.items.splice(itemIndex, 1);
    await this.cartStoreProvider.saveStoredCart(userId, cart);

    return this.getMyCartProvider.getMyCart(userId);
  }
}
