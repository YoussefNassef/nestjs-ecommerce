import { Injectable } from '@nestjs/common';
import { Cart } from '../entities/cart.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetMyCartProvider } from './get-my-cart.provider';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class ClearCartProvider {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private readonly getMyCartProvider: GetMyCartProvider,
  ) {}
  async clearCart(userId: number) {
    const cart = await this.getMyCartProvider.getMyCart(userId);
    await this.cartItemRepository.delete({ cart: { id: cart.id } });
    cart.items = [];
    cart.totalPrice = 0;
    cart.totalItems = 0;

    return this.cartRepository.save(cart);
  }
}
