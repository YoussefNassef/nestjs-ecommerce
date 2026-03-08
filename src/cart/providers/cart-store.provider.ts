import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/providers/redis.service';
import { StoredCart } from '../types/stored-cart.type';

@Injectable()
export class CartStoreProvider {
  private readonly ttlSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds =
      this.configService.get<number>('CART_TTL_SECONDS') ?? 604800;
  }

  getCartKey(userId: number): string {
    return `cart:${userId}`;
  }

  async getStoredCart(userId: number): Promise<StoredCart | null> {
    return this.redisService.getJson<StoredCart>(this.getCartKey(userId));
  }

  async getStoredCartOrThrow(userId: number): Promise<StoredCart> {
    const cart = await this.getStoredCart(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }

  async saveStoredCart(userId: number, cart: StoredCart): Promise<void> {
    await this.redisService.setJson(
      this.getCartKey(userId),
      cart,
      this.ttlSeconds,
    );
  }
}
