import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CouponDiscountType } from './enums/coupon-discount-type.enum';

@Entity('coupons')
export class Coupon {
  @ApiProperty({
    description: 'Unique coupon identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Unique coupon code',
    example: 'RAMADAN10',
  })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  code: string;

  @ApiProperty({
    description: 'Discount calculation type',
    enum: CouponDiscountType,
    example: CouponDiscountType.PERCENTAGE,
  })
  @Column({
    type: 'enum',
    enum: CouponDiscountType,
  })
  discountType: CouponDiscountType;

  @ApiProperty({
    description: 'Discount value (percent or fixed amount)',
    example: 10,
  })
  @Column({ type: 'int' })
  discountValue: number;

  @ApiPropertyOptional({
    description: 'Minimum cart subtotal required for this coupon',
    example: 200,
  })
  @Column({ type: 'int', nullable: true })
  minOrderAmount?: number | null;

  @ApiPropertyOptional({
    description: 'Maximum discount amount (used mainly with percentage)',
    example: 100,
  })
  @Column({ type: 'int', nullable: true })
  maxDiscountAmount?: number | null;

  @ApiPropertyOptional({
    description: 'Coupon start date/time',
    example: '2026-03-10T00:00:00Z',
  })
  @Column({ type: 'timestamptz', nullable: true })
  startsAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Coupon expiry date/time',
    example: '2026-04-10T00:00:00Z',
  })
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @ApiProperty({
    description: 'Whether coupon is active',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Coupon creation timestamp',
    example: '2026-03-05T12:00:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Coupon last update timestamp',
    example: '2026-03-05T12:30:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
