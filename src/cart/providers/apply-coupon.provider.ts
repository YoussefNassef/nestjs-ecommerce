import { BadRequestException, Injectable } from '@nestjs/common';
import { ApplyCouponDto } from 'src/coupons/dtos/apply-coupon.dto';
import { CouponsService } from 'src/coupons/providers/coupons.service';
import { BuildCartResponseProvider } from './build-cart-response.provider';
import { CartStoreProvider } from './cart-store.provider';

@Injectable()
export class ApplyCouponProvider {
  constructor(
    private readonly cartStoreProvider: CartStoreProvider,
    private readonly buildCartResponseProvider: BuildCartResponseProvider,
    private readonly couponsService: CouponsService,
  ) {}

  async applyCoupon(userId: number, dto: ApplyCouponDto) {
    const cart = await this.cartStoreProvider.getStoredCartOrThrow(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Cannot apply coupon to empty cart');
    }

    const cartResponse = await this.buildCartResponseProvider.buildCartResponse(
      userId,
      cart,
    );
    await this.couponsService.calculateDiscount(dto.code, cartResponse.totalPrice);

    cart.appliedCouponCode = dto.code.trim().toUpperCase();
    await this.cartStoreProvider.saveStoredCart(userId, cart);

    return this.buildCartResponseProvider.buildCartResponse(userId, cart);
  }
}
