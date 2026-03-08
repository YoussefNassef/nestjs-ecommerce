import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Product } from 'src/products/products.entity';
import { Repository } from 'typeorm';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { BuildCartResponseProvider } from './build-cart-response.provider';
import { CartStoreProvider } from './cart-store.provider';

@Injectable()
export class AddToCartProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cartStoreProvider: CartStoreProvider,
    private readonly buildCartResponseProvider: BuildCartResponseProvider,
  ) {}

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const product = await this.productRepository.findOne({
      where: { id: addToCartDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const cart = (await this.cartStoreProvider.getStoredCart(userId)) ?? {
      items: [],
    };
    const existingItem = cart.items.find(
      (item) => item.productId === addToCartDto.productId,
    );

    if (existingItem) {
      existingItem.quantity += addToCartDto.quantity;
    } else {
      cart.items.push({
        id: randomUUID(),
        productId: addToCartDto.productId,
        quantity: addToCartDto.quantity,
        price: product.price,
      });
    }

    await this.cartStoreProvider.saveStoredCart(userId, cart);
    return this.buildCartResponseProvider.buildCartResponse(userId, cart);
  }
}
