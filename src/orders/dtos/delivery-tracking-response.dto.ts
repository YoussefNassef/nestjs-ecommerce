import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { OrderTrackingEventResponseDto } from './order-tracking-event-response.dto';

export class DeliveryTrackingResponseDto {
  @ApiProperty({
    description: 'Order id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  orderId: string;

  @ApiProperty({
    description: 'Current delivery lifecycle status',
    enum: DeliveryStatus,
    example: DeliveryStatus.SHIPPED,
  })
  deliveryStatus: DeliveryStatus;

  @ApiProperty({
    description: 'Carrier tracking number',
    required: false,
    nullable: true,
  })
  trackingNumber?: string | null;

  @ApiProperty({
    description: 'Shipping carrier',
    required: false,
    nullable: true,
  })
  shippingCarrier?: string | null;

  @ApiProperty({
    description: 'Tracking URL',
    required: false,
    nullable: true,
  })
  trackingUrl?: string | null;

  @ApiProperty({
    description: 'Current location',
    required: false,
    nullable: true,
  })
  currentLocation?: string | null;

  @ApiProperty({
    description: 'Latest tracking note',
    required: false,
    nullable: true,
  })
  trackingNote?: string | null;

  @ApiProperty({
    description: 'Estimated delivery datetime',
    required: false,
    nullable: true,
  })
  estimatedDeliveryAt?: Date | null;

  @ApiProperty({
    description: 'Shipped timestamp',
    required: false,
    nullable: true,
  })
  shippedAt?: Date | null;

  @ApiProperty({
    description: 'Out for delivery timestamp',
    required: false,
    nullable: true,
  })
  outForDeliveryAt?: Date | null;

  @ApiProperty({
    description: 'Delivered timestamp',
    required: false,
    nullable: true,
  })
  deliveredAt?: Date | null;

  @ApiProperty({
    description: 'Delivery status last updated at',
    required: false,
    nullable: true,
  })
  deliveryStatusUpdatedAt?: Date | null;

  @ApiProperty({
    description: 'Chronological tracking history (oldest to newest)',
    type: [OrderTrackingEventResponseDto],
  })
  timeline: OrderTrackingEventResponseDto[];
}
