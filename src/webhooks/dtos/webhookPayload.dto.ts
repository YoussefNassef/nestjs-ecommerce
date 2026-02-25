import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoyasarPaymentStatus } from '../enums/paymentStatus';

export class MoyasarWebhookPayloadDto {
  @ApiProperty({
    description: 'Unique payment identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Payment status',
    enum: MoyasarPaymentStatus,
    example: MoyasarPaymentStatus.PAID,
  })
  @IsEnum(MoyasarPaymentStatus)
  status: MoyasarPaymentStatus;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit',
    example: 499999,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'SAR',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Payment description',
    example: 'Order payment for iPhone 15 Pro',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Payment source information',
    example: { type: 'creditcard', company: 'visa' },
  })
  @IsObject()
  source: any;

  @ApiPropertyOptional({
    description: 'Additional payment data',
    example: {
      id: 'txn_123',
      metadata: {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
      },
    },
  })
  @IsOptional()
  data: {
    id: string;
    status: MoyasarPaymentStatus;
    metadata?: {
      orderId?: string;
      userId?: string;
    };
  };

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @IsString()
  created_at: string;
}
