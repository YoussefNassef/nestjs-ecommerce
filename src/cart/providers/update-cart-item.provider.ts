import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCartItemDto } from '../dtos/update-cart-item.dto';
import { GetMyCartProvider } from './get-my-cart.provider';
import { CartStoreProvider } from './cart-store.provider';

@Injectable()
export class UpdateCartItemProvider {
  constructor(
    private readonly getMyCartProvider: GetMyCartProvider,
    private readonly cartStoreProvider: CartStoreProvider,
  ) {}

  async updateCartItem(
    userId: number,
    cartItemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.cartStoreProvider.getStoredCartOrThrow(userId);
    const item = cart.items.find((cartItem) => cartItem.id === cartItemId);

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = updateCartItemDto.quantity;
    await this.cartStoreProvider.saveStoredCart(userId, cart);
    return this.getMyCartProvider.getMyCart(userId);
  }
}
