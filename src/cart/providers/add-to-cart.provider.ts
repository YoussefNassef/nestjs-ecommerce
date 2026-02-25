/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { ProductsService } from 'src/products/providers/products.service';
import { Cart } from '../entities/cart.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetMyCartProvider } from './get-my-cart.provider';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class AddToCartProvider {
  constructor(
    private readonly productService: ProductsService,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private readonly getMyCartProvider: GetMyCartProvider,
  ) {}

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const product = await this.productService.findOne(addToCartDto.productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const cart = await this.getOrCreateCartForUser(userId);

    let cartItem = await this.cartItemRepository.findOne({
      where: { cart: { id: cart.id }, product: { id: addToCartDto.productId } },
    });

    if (cartItem) {
      cartItem.updateQuantity(cartItem.quantity + addToCartDto.quantity);
    } else {
      cartItem = CartItem.create({
        cart,
        product,
        quantity: addToCartDto.quantity,
        price: product.price,
      });
    }

    await this.cartItemRepository.save(cartItem);

    await this.updateCartTotals(cart.id);

    return this.getMyCartProvider.getMyCart(userId);
  }

  private async getOrCreateCartForUser(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: { id: userId } as any,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
      await this.cartRepository.save(cart);
    }

    return cart;
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
