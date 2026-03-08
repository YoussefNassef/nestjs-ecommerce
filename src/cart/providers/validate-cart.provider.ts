import { Injectable } from '@nestjs/common';
import { BuildCartResponseProvider } from './build-cart-response.provider';
import { CartStoreProvider } from './cart-store.provider';
import { CartValidationIssue } from '../types/stored-cart.type';
import { CouponsService } from 'src/coupons/providers/coupons.service';

@Injectable()
export class ValidateCartProvider {
  constructor(
    private readonly cartStoreProvider: CartStoreProvider,
    private readonly buildCartResponseProvider: BuildCartResponseProvider,
    private readonly couponsService: CouponsService,
  ) {}

  async validateCart(userId: number) {
    const cart = await this.cartStoreProvider.getStoredCart(userId);

    if (!cart || cart.items.length === 0) {
      return {
        valid: false,
        issues: [
          {
            itemId: '',
            productId: '',
            code: 'CART_EMPTY',
            message: 'Cart is empty',
          },
        ] satisfies CartValidationIssue[],
        cart: {
          id: `cart:${userId}`,
          items: [],
          totalPrice: 0,
          totalItems: 0,
        },
      };
    }

    const productsMap = await this.buildCartResponseProvider.getProductsMap(
      cart.items.map((item) => item.productId),
    );

    const issues: CartValidationIssue[] = [];

    for (const item of cart.items) {
      const product = productsMap.get(item.productId);

      if (!product) {
        issues.push({
          itemId: item.id,
          productId: item.productId,
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product no longer exists',
        });
        continue;
      }

      if (!product.isActive) {
        issues.push({
          itemId: item.id,
          productId: item.productId,
          code: 'PRODUCT_INACTIVE',
          message: 'Product is not available',
        });
      }

      if (product.stock < item.quantity) {
        issues.push({
          itemId: item.id,
          productId: item.productId,
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${product.stock} item(s) left in stock`,
        });
      }
    }

    const subtotalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    if (cart.appliedCouponCode) {
      try {
        await this.couponsService.calculateDiscount(
          cart.appliedCouponCode,
          subtotalAmount,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Applied coupon is invalid';
        issues.push({
          itemId: '',
          productId: '',
          code: 'COUPON_INVALID',
          message,
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      cart: await this.buildCartResponseProvider.buildCartResponse(
        userId,
        cart,
      ),
    };
  }
}
