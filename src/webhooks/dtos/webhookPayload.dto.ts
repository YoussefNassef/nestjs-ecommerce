import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoyasarPaymentStatus } from '../enums/paymentStatus';
import { Type } from 'class-transformer';

class MoyasarWebhookDataMetadataDto {
  @ApiPropertyOptional({
    description: 'Order UUID reference from gateway metadata',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'User reference from gateway metadata',
    example: '1',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

class MoyasarWebhookDataDto {
  @ApiProperty({
    description: 'Gateway payment identifier',
    example: 'pay_123456789',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Gateway payment status',
    enum: MoyasarPaymentStatus,
    example: MoyasarPaymentStatus.PAID,
  })
  @IsEnum(MoyasarPaymentStatus)
  status: MoyasarPaymentStatus;

  @ApiPropertyOptional({
    description: 'Gateway metadata object',
    type: () => MoyasarWebhookDataMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoyasarWebhookDataMetadataDto)
  metadata?: MoyasarWebhookDataMetadataDto;
}

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
  @IsDefined()
  @ValidateNested()
  @Type(() => MoyasarWebhookDataDto)
  data: MoyasarWebhookDataDto;

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @IsString()
  created_at: string;
}
