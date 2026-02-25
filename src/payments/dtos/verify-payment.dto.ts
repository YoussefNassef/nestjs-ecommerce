import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'Payment transaction ID',
    example: 'txn_550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Payment status',
    example: 'completed',
  })
  @IsString()
  status: string;
}
