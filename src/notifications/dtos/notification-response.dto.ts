import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';

export class NotificationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.ORDER_CREATED })
  type: NotificationType;

  @ApiProperty({ example: 'Your order has been created' })
  title: string;

  @ApiProperty({ example: 'Order #123 was created and stock is reserved for checkout.' })
  body: string;

  @ApiProperty({
    example: { orderId: '550e8400-e29b-41d4-a716-446655440000' },
    required: false,
    nullable: true,
  })
  data?: Record<string, unknown> | null;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ required: false, nullable: true })
  readAt?: Date | null;

  @ApiProperty({ example: '2026-03-07T12:30:00.000Z' })
  createdAt: Date;
}
