import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CouponDiscountType } from '../enums/coupon-discount-type.enum';

export class CreateCouponDto {
  @ApiProperty({
    description: 'Unique coupon code',
    example: 'RAMADAN10',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Discount type',
    enum: CouponDiscountType,
    example: CouponDiscountType.PERCENTAGE,
  })
  @IsEnum(CouponDiscountType)
  discountType: CouponDiscountType;

  @ApiProperty({
    description: 'Discount value (percent or fixed amount)',
    example: 10,
  })
  @IsInt()
  @Min(1)
  discountValue: number;

  @ApiPropertyOptional({
    description: 'Minimum subtotal required',
    example: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum discount cap',
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({
    description: 'Coupon start date',
    example: '2026-03-10T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({
    description: 'Coupon expiry date',
    example: '2026-04-10T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Coupon status',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
