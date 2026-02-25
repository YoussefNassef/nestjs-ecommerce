import { Injectable } from '@nestjs/common';
import { UpdateCartItemDto } from '../dtos/update-cart-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { GetMyCartProvider } from './get-my-cart.provider';
import { GetCartItemProvider } from './get-cart-item.provider';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class UpdateCartItemProvider {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private readonly getMyCartProvider: GetMyCartProvider,
    private readonly getCartItemProvider: GetCartItemProvider,
  ) {}
  async updateCartItem(
    userId: number,
    cartItemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.getMyCartProvider.getMyCart(userId);
    const cartItem = await this.getCartItemProvider.getCartItem(cartItemId);

    cartItem.updateQuantity(updateCartItemDto.quantity);

    await this.cartItemRepository.save(cartItem);

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
