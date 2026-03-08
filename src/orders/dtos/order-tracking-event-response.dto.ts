import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { TrackingEventActorType } from '../enums/tracking-event-actor-type.enum';

export class OrderTrackingEventResponseDto {
  @ApiProperty({
    description: 'Tracking event id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Delivery status captured in this event',
    enum: DeliveryStatus,
    example: DeliveryStatus.OUT_FOR_DELIVERY,
  })
  deliveryStatus: DeliveryStatus;

  @ApiProperty({
    description: 'Carrier tracking number at this event',
    required: false,
    nullable: true,
  })
  trackingNumber?: string | null;

  @ApiProperty({
    description: 'Shipping carrier at this event',
    required: false,
    nullable: true,
  })
  shippingCarrier?: string | null;

  @ApiProperty({
    description: 'Tracking URL at this event',
    required: false,
    nullable: true,
  })
  trackingUrl?: string | null;

  @ApiProperty({
    description: 'Current location at this event',
    required: false,
    nullable: true,
  })
  currentLocation?: string | null;

  @ApiProperty({
    description: 'Tracking note at this event',
    required: false,
    nullable: true,
  })
  trackingNote?: string | null;

  @ApiProperty({
    description: 'When this event happened',
    example: '2026-03-08T19:20:00.000Z',
  })
  eventAt: Date;

  @ApiProperty({
    description: 'Who generated this event',
    enum: TrackingEventActorType,
    example: TrackingEventActorType.ADMIN,
  })
  actorType: TrackingEventActorType;

  @ApiProperty({
    description: 'Admin user id that generated this event',
    required: false,
    nullable: true,
    example: 1,
  })
  actorUserId?: number | null;
}
