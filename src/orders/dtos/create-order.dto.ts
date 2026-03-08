import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { ShippingMethod } from '../enums/shipping-method.enum';

export class CreateOrderDto {
  @ApiProperty({
    description: 'User shipping address id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  addressId: string;

  @ApiProperty({
    description: 'Shipping method',
    enum: ShippingMethod,
    example: ShippingMethod.STANDARD,
  })
  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;
}
