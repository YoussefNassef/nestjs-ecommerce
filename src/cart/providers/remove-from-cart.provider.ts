import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from '../entities/cart.entity';
import { Repository } from 'typeorm';
import { GetMyCartProvider } from './get-my-cart.provider';
import { GetCartItemProvider } from './get-cart-item.provider';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class RemoveFromCartProvider {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private readonly getMyCartProvider: GetMyCartProvider,
    private readonly getCartItemProvider: GetCartItemProvider,
  ) {}
  async removeFromCart(userId: number, cartItemId: string) {
    const cart = await this.getMyCartProvider.getMyCart(userId);
    const cartItem = await this.getCartItemProvider.getCartItem(cartItemId);

    await this.cartItemRepository.remove(cartItem);

    await this.updateCartTotals(cart.id);

    return this.getMyCartProvider.getMyCart(userId);
  }

  private async updateCartTotals(cartId: string) {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) {
      return;
    }

    cart.recalculateTotals();
    await this.cartRepository.save(cart);
  }
}
