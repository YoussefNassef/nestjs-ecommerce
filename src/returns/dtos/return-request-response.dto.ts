import { ApiProperty } from '@nestjs/swagger';
import { ReturnReason } from '../enums/return-reason.enum';
import { ReturnRequestStatus } from '../enums/return-request-status.enum';

export class ReturnRequestResponseDto {
  @ApiProperty({
    description: 'Return request id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Order id linked to this return request',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  orderId: string;

  @ApiProperty({
    description: 'User id who created the return request',
    example: 10,
  })
  userId: number;

  @ApiProperty({
    description: 'Return reason selected by customer',
    enum: ReturnReason,
    example: ReturnReason.DAMAGED,
  })
  reason: ReturnReason;

  @ApiProperty({
    description: 'Optional return details from customer',
    required: false,
    nullable: true,
  })
  reasonDetails?: string | null;

  @ApiProperty({
    description: 'Current return request status',
    enum: ReturnRequestStatus,
    example: ReturnRequestStatus.REQUESTED,
  })
  status: ReturnRequestStatus;

  @ApiProperty({
    description: 'Refund amount in smallest currency unit',
    example: 12000,
  })
  refundAmount: number;

  @ApiProperty({
    description: 'Optional admin note',
    required: false,
    nullable: true,
  })
  adminNote?: string | null;

  @ApiProperty({
    description: 'Admin user id that handled the request',
    required: false,
    nullable: true,
  })
  handledByAdminUserId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  approvedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  rejectedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  refundInitiatedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  refundedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  cancelledAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
