import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../enum/order.status.enum';
import { PaymentStatus } from 'src/payments/enums/PaymentStatus.enum';
import { Product } from 'src/products/products.entity';

export class OrderItemResponseDto {
  @ApiProperty({
    description: 'Unique order item identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Product associated with this order item',
    type: () => Product,
  })
  product: Product;

  @ApiProperty({
    description: 'Price of the product at the time of ordering',
    example: 499999,
  })
  price: number;

  @ApiProperty({
    description: 'Quantity of the product in this order item',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Subtotal for this item (price * quantity)',
    example: 999998,
  })
  subtotal: number;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Unique payment identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Moyasar payment gateway identifier',
    example: 'pay_550e8400-e29b-41d4-a716-446655440000',
  })
  moyasarPaymentId: string;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit',
    example: 499999,
  })
  amount: number;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  createdAt: Date;
}

export class OrderResponseDto {
  @ApiProperty({
    description: 'Unique order identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Total amount for the order (sum of item subtotals)',
    example: 1499997,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Items included in this order',
    type: () => [OrderItemResponseDto],
  })
  items: OrderItemResponseDto[];

  @ApiProperty({
    description: 'Payment information for this order',
    type: () => PaymentResponseDto,
    required: false,
    nullable: true,
  })
  payment?: PaymentResponseDto | null;

  @ApiProperty({
    description: 'Order creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  createdAt: Date;
}
