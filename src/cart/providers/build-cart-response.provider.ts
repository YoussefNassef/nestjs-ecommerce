import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/products.entity';
import { In, Repository } from 'typeorm';
import { StoredCart } from '../types/stored-cart.type';
import { CouponsService } from 'src/coupons/providers/coupons.service';

@Injectable()
export class BuildCartResponseProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly couponsService: CouponsService,
  ) {}

  async getProductsMap(productIds: string[]): Promise<Map<string, Product>> {
    if (productIds.length === 0) {
      return new Map<string, Product>();
    }

    const uniqueProductIds = [...new Set(productIds)];
    const products = await this.productRepository.find({
      where: { id: In(uniqueProductIds) },
      relations: ['category'],
    });

    return new Map(products.map((product) => [product.id, product]));
  }

  async buildCartResponse(userId: number, cart: StoredCart) {
    const productsMap = await this.getProductsMap(
      cart.items.map((item) => item.productId),
    );

    const hydratedItems = cart.items
      .map((item) => {
        const product = productsMap.get(item.productId);
        if (!product) {
          return null;
        }

        return {
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          product,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const totalPrice = hydratedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const totalItems = hydratedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    let discountAmount = 0;
    let coupon: {
      code: string;
      discountAmount: number;
    } | null = null;

    if (cart.appliedCouponCode) {
      try {
        const calculation = await this.couponsService.calculateDiscount(
          cart.appliedCouponCode,
          totalPrice,
        );
        discountAmount = calculation.discountAmount;
        coupon = {
          code: calculation.coupon.code,
          discountAmount,
        };
      } catch {
        discountAmount = 0;
        coupon = null;
      }
    }

    return {
      id: `cart:${userId}`,
      items: hydratedItems,
      totalPrice,
      totalItems,
      discountAmount,
      payableTotal: Math.max(0, totalPrice - discountAmount),
      coupon,
    };
  }
}
