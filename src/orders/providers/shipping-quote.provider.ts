import { Injectable } from '@nestjs/common';
import { ShippingMethod } from '../enums/shipping-method.enum';

@Injectable()
export class ShippingQuoteProvider {
  getQuote(shippingMethod: ShippingMethod, subtotalAmount: number) {
    if (shippingMethod === ShippingMethod.EXPRESS) {
      return {
        shippingMethod,
        shippingCost: 60,
        shippingEtaDays: 1,
      };
    }

    const freeThreshold = 500;
    return {
      shippingMethod: ShippingMethod.STANDARD,
      shippingCost: subtotalAmount >= freeThreshold ? 0 : 30,
      shippingEtaDays: 3,
    };
  }
}
