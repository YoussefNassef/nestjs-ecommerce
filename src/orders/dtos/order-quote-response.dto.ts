import { ApiProperty } from '@nestjs/swagger';
import { ShippingMethod } from '../enums/shipping-method.enum';

export class OrderQuoteResponseDto {
  @ApiProperty({ example: 1200 })
  subtotalAmount: number;

  @ApiProperty({ example: 120 })
  discountAmount: number;

  @ApiProperty({ example: 'RAMADAN10', required: false, nullable: true })
  couponCode?: string | null;

  @ApiProperty({ enum: ShippingMethod, example: ShippingMethod.STANDARD })
  shippingMethod: ShippingMethod;

  @ApiProperty({ example: 30 })
  shippingCost: number;

  @ApiProperty({ example: 3 })
  shippingEtaDays: number;

  @ApiProperty({ example: 1110 })
  totalAmount: number;
}
