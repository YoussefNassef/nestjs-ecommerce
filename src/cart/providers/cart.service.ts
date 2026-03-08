import { Injectable } from '@nestjs/common';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { UpdateCartItemDto } from '../dtos/update-cart-item.dto';
import { ApplyCouponDto } from 'src/coupons/dtos/apply-coupon.dto';
import { AddToCartProvider } from './add-to-cart.provider';
import { ApplyCouponProvider } from './apply-coupon.provider';
import { ClearCartProvider } from './clear-cart.provider';
import { GetMyCartProvider } from './get-my-cart.provider';
import { RemoveCouponProvider } from './remove-coupon.provider';
import { RemoveFromCartProvider } from './remove-from-cart.provider';
import { UpdateCartItemProvider } from './update-cart-item.provider';
import { ValidateCartProvider } from './validate-cart.provider';

@Injectable()
export class CartService {
  constructor(
    private readonly getMyCartProvider: GetMyCartProvider,
    private readonly addToCartProvider: AddToCartProvider,
    private readonly updateCartItemProvider: UpdateCartItemProvider,
    private readonly removeFromCartProvider: RemoveFromCartProvider,
    private readonly clearCartProvider: ClearCartProvider,
    private readonly validateCartProvider: ValidateCartProvider,
    private readonly applyCouponProvider: ApplyCouponProvider,
    private readonly removeCouponProvider: RemoveCouponProvider,
  ) {}

  async getCart(userId: number) {
    return this.getMyCartProvider.getMyCart(userId);
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    return this.addToCartProvider.addToCart(userId, addToCartDto);
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

  async removeFromCart(userId: number, cartItemId: string) {
    return this.removeFromCartProvider.removeFromCart(userId, cartItemId);
  }

  async clearCart(userId: number) {
    return this.clearCartProvider.clearCart(userId);
  }

  async validateCart(userId: number) {
    return this.validateCartProvider.validateCart(userId);
  }

  async applyCoupon(userId: number, dto: ApplyCouponDto) {
    return this.applyCouponProvider.applyCoupon(userId, dto);
  }

  async removeCoupon(userId: number) {
    return this.removeCouponProvider.removeCoupon(userId);
  }
}
