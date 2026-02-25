import { IsNumber, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'UUID of the order to pay for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Cardholder name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Credit card number',
    example: '4111111111111111',
  })
  @IsString()
  number: string;

  @ApiProperty({
    description: 'Card expiration month (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  month: number;

  @ApiProperty({
    description: 'Card expiration year',
    example: 2025,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'Card CVC/CVV code',
    example: '123',
  })
  @IsString()
  cvc: string;
}
