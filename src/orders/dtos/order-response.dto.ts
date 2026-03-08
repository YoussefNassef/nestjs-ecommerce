import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../enum/order.status.enum';
import { PaymentStatus } from 'src/payments/enums/PaymentStatus.enum';
import { Product } from 'src/products/products.entity';
import { ShippingMethod } from '../enums/shipping-method.enum';
import { DeliveryStatus } from '../enums/delivery-status.enum';

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
    description: 'Whether stock is currently reserved for this order',
    example: true,
  })
  stockReserved: boolean;

  @ApiProperty({
    description: 'When the current stock reservation expires',
    required: false,
    nullable: true,
  })
  reservationExpiresAt?: Date | null;

  @ApiProperty({
    description: 'Total amount for the order (sum of item subtotals)',
    example: 1499997,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Subtotal before any discount',
    example: 1499997,
  })
  subtotalAmount: number;

  @ApiProperty({
    description: 'Discount applied to this order',
    example: 100000,
  })
  discountAmount: number;

  @ApiProperty({
    description: 'Applied coupon code',
    required: false,
    nullable: true,
    example: 'RAMADAN10',
  })
  couponCode?: string | null;

  @ApiProperty({
    description: 'Shipping method selected',
    enum: ShippingMethod,
    example: ShippingMethod.STANDARD,
  })
  shippingMethod: ShippingMethod;

  @ApiProperty({
    description: 'Shipping cost amount',
    example: 30,
  })
  shippingCost: number;

  @ApiProperty({
    description: 'Estimated delivery in days',
    example: 3,
  })
  shippingEtaDays: number;

  @ApiProperty({
    description: 'Current delivery lifecycle status',
    enum: DeliveryStatus,
    example: DeliveryStatus.PENDING,
  })
  deliveryStatus: DeliveryStatus;

  @ApiProperty({
    description: 'Carrier tracking number',
    required: false,
    nullable: true,
    example: 'TRK-93820393',
  })
  trackingNumber?: string | null;

  @ApiProperty({
    description: 'Shipping carrier',
    required: false,
    nullable: true,
    example: 'Aramex',
  })
  shippingCarrier?: string | null;

  @ApiProperty({
    description: 'Tracking URL',
    required: false,
    nullable: true,
    example: 'https://tracking.example.com/TRK-93820393',
  })
  trackingUrl?: string | null;

  @ApiProperty({
    description: 'Current package location',
    required: false,
    nullable: true,
    example: 'Riyadh Hub',
  })
  currentLocation?: string | null;

  @ApiProperty({
    description: 'Last tracking note',
    required: false,
    nullable: true,
    example: 'Package sorted and moved to outbound truck',
  })
  trackingNote?: string | null;

  @ApiProperty({
    description: 'Estimated delivery timestamp',
    required: false,
    nullable: true,
  })
  estimatedDeliveryAt?: Date | null;

  @ApiProperty({
    description: 'When shipment was marked as shipped',
    required: false,
    nullable: true,
  })
  shippedAt?: Date | null;

  @ApiProperty({
    description: 'When shipment was marked out for delivery',
    required: false,
    nullable: true,
  })
  outForDeliveryAt?: Date | null;

  @ApiProperty({
    description: 'When shipment was marked delivered',
    required: false,
    nullable: true,
  })
  deliveredAt?: Date | null;

  @ApiProperty({
    description: 'Last delivery status update timestamp',
    required: false,
    nullable: true,
  })
  deliveryStatusUpdatedAt?: Date | null;

  @ApiProperty({
    description: 'Shipping address snapshot',
    required: false,
    nullable: true,
  })
  shippingAddressSnapshot?: Record<string, unknown> | null;

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
