import { BadRequestException, Injectable } from '@nestjs/common';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { CartService } from 'src/cart/providers/cart.service';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { AddressesService } from 'src/addresses/providers/addresses.service';
import { ShippingQuoteProvider } from './shipping-quote.provider';

@Injectable()
export class QuoteOrderProvider {
  constructor(
    private readonly cartService: CartService,
    private readonly addressesService: AddressesService,
    private readonly shippingQuoteProvider: ShippingQuoteProvider,
  ) {}

  async quote(user: ActiveUserData, dto: CreateOrderDto) {
    const validation = await this.cartService.validateCart(user.sub);
    if (!validation.valid) {
      throw new BadRequestException(
        validation.issues[0]?.message ?? 'Invalid cart',
      );
    }

    await this.addressesService.getOwnedAddressForOrder(
      user.sub,
      dto.addressId,
    );

    const shipping = this.shippingQuoteProvider.getQuote(
      dto.shippingMethod,
      validation.cart.totalPrice,
    );

    const subtotalAmount = validation.cart.totalPrice;
    const discountAmount =
      'discountAmount' in validation.cart ? validation.cart.discountAmount : 0;
    const couponCode =
      'coupon' in validation.cart
        ? (validation.cart.coupon?.code ?? null)
        : null;
    const totalAmount =
      Math.max(0, subtotalAmount - discountAmount) + shipping.shippingCost;

    return {
      subtotalAmount,
      discountAmount,
      couponCode,
      shippingMethod: shipping.shippingMethod,
      shippingCost: shipping.shippingCost,
      shippingEtaDays: shipping.shippingEtaDays,
      totalAmount,
    };
  }
}
