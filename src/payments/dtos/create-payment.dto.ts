import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const CURRENT_YEAR = new Date().getFullYear();

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
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '',
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z ]+$/, {
    message: 'Cardholder name must use English letters only',
  })
  name: string;

  @ApiProperty({
    description: 'Credit card number',
    example: '4111111111111111',
  })
  @IsString()
  @Matches(/^\d{13,19}$/)
  number: string;

  @ApiProperty({
    description: 'Card expiration month (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Card expiration year',
    example: CURRENT_YEAR,
  })
  @IsInt()
  @Min(CURRENT_YEAR)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Card CVC/CVV code',
    example: '123',
  })
  @IsString()
  @Length(3, 4)
  @Matches(/^\d+$/)
  cvc: string;
}
