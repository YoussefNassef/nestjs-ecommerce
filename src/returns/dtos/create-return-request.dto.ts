import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ReturnReason } from '../enums/return-reason.enum';

export class CreateReturnRequestDto {
  @ApiProperty({
    description: 'Order id to create return request for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Reason for return request',
    enum: ReturnReason,
    example: ReturnReason.DAMAGED,
  })
  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @ApiPropertyOptional({
    description: 'Optional details about return reason',
    example: 'The box arrived open and screen has a visible crack.',
  })
  @IsOptional()
  @IsString()
  @Length(3, 500)
  reasonDetails?: string;
}
