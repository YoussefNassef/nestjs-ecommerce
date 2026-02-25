import { Injectable } from '@nestjs/common';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { UpdateCartItemDto } from '../dtos/update-cart-item.dto';
import { GetMyCartProvider } from './get-my-cart.provider';
import { AddToCartProvider } from './add-to-cart.provider';
import { UpdateCartItemProvider } from './update-cart-item.provider';
import { RemoveFromCartProvider } from './remove-from-cart.provider';
import { ClearCartProvider } from './clear-cart.provider';

@Injectable()
export class CartService {
  constructor(
    private readonly getMyCartProvider: GetMyCartProvider,
    private readonly addToCartProvider: AddToCartProvider,
    private readonly updateCartItemProvider: UpdateCartItemProvider,
    private readonly removeFromCartProvider: RemoveFromCartProvider,
    private readonly clearCartProvider: ClearCartProvider,
  ) {}

  async getCart(userId: number) {
    return this.getMyCartProvider.getMyCart(userId);
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    return this.addToCartProvider.addToCart(userId, addToCartDto);
  }

  async removeFromCart(userId: number, cartItemId: string) {
    return this.removeFromCartProvider.removeFromCart(userId, cartItemId);
  }

  async updateCartItem(
    userId: number,
    cartItemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.updateCartItemProvider.updateCartItem(
      userId,
      cartItemId,
      updateCartItemDto,
    );
  }

  async clearCart(userId: number) {
    return this.clearCartProvider.clearCart(userId);
  }
}
