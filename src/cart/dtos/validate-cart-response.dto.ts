import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/products/products.entity';

export enum CartValidationCode {
  CART_EMPTY = 'CART_EMPTY',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_INACTIVE = 'PRODUCT_INACTIVE',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  COUPON_INVALID = 'COUPON_INVALID',
}

export class CartValidationIssueDto {
  @ApiProperty({
    description: 'Cart item identifier (empty only when cart is empty)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  itemId: string;

  @ApiProperty({
    description: 'Product identifier (empty only when cart is empty)',
    example: '550e8400-e29b-41d4-a716-446655440111',
  })
  productId: string;

  @ApiProperty({
    description: 'Validation failure code',
    enum: CartValidationCode,
    example: CartValidationCode.INSUFFICIENT_STOCK,
  })
  code: CartValidationCode;

  @ApiProperty({
    description: 'Human-readable validation message',
    example: 'Only 2 item(s) left in stock',
  })
  message: string;
}

export class CartItemSnapshotDto {
  @ApiProperty({
    description: 'Cart item identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Quantity selected in cart',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price snapshot at add-to-cart time',
    example: 4999,
  })
  price: number;

  @ApiProperty({
    description: 'Subtotal (price * quantity)',
    example: 9998,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Hydrated product data',
    type: () => Product,
  })
  product: Product;
}

export class CartSnapshotDto {
  @ApiProperty({
    description: 'Cart key-like identifier',
    example: 'cart:1',
  })
  id: string;

  @ApiProperty({
    description: 'Current cart items',
    type: () => [CartItemSnapshotDto],
  })
  items: CartItemSnapshotDto[];

  @ApiProperty({
    description: 'Total cart amount',
    example: 9998,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Total quantity in cart',
    example: 2,
  })
  totalItems: number;
}

export class ValidateCartResponseDto {
  @ApiProperty({
    description: 'Whether cart is valid for checkout',
    example: false,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Validation issues list',
    type: () => [CartValidationIssueDto],
  })
  issues: CartValidationIssueDto[];

  @ApiProperty({
    description: 'Current cart snapshot',
    type: () => CartSnapshotDto,
  })
  cart: CartSnapshotDto;
}
