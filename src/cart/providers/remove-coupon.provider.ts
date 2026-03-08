import { Injectable } from '@nestjs/common';
import { BuildCartResponseProvider } from './build-cart-response.provider';
import { CartStoreProvider } from './cart-store.provider';

@Injectable()
export class RemoveCouponProvider {
  constructor(
    private readonly cartStoreProvider: CartStoreProvider,
    private readonly buildCartResponseProvider: BuildCartResponseProvider,
  ) {}

  async removeCoupon(userId: number) {
    const cart = await this.cartStoreProvider.getStoredCartOrThrow(userId);
    cart.appliedCouponCode = null;
    await this.cartStoreProvider.saveStoredCart(userId, cart);
    return this.buildCartResponseProvider.buildCartResponse(userId, cart);
  }
}
