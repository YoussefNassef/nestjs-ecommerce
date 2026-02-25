import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GetMyCartProvider {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  async getMyCart(userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }
}
