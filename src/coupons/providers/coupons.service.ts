import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from '../coupon.entity';
import { Repository } from 'typeorm';
import { CreateCouponDto } from '../dtos/create-coupon.dto';
import { UpdateCouponDto } from '../dtos/update-coupon.dto';
import { CouponDiscountType } from '../enums/coupon-discount-type.enum';

export type CouponCalculationResult = {
  coupon: Coupon;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
};

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(dto: CreateCouponDto) {
    const normalizedCode = dto.code.trim().toUpperCase();
    const existing = await this.couponRepository.findOne({
      where: { code: normalizedCode },
    });
    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    this.validateCouponShape(dto.discountType, dto.discountValue);

    const coupon = this.couponRepository.create({
      ...dto,
      code: normalizedCode,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: dto.isActive ?? true,
    });
    return this.couponRepository.save(coupon);
  }

  async findAll() {
    return this.couponRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.findOne(id);

    if (dto.code) {
      const normalizedCode = dto.code.trim().toUpperCase();
      const existing = await this.couponRepository.findOne({
        where: { code: normalizedCode },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Coupon code already exists');
      }
      coupon.code = normalizedCode;
    }

    const nextType = dto.discountType ?? coupon.discountType;
    const nextValue = dto.discountValue ?? coupon.discountValue;
    this.validateCouponShape(nextType, nextValue);

    Object.assign(coupon, {
      ...dto,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : coupon.startsAt,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : coupon.expiresAt,
    });

    return this.couponRepository.save(coupon);
  }

  async remove(id: string) {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
    return { message: 'Coupon removed successfully' };
  }

  async calculateDiscount(
    code: string,
    subtotalAmount: number,
  ): Promise<CouponCalculationResult> {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await this.couponRepository.findOne({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const now = new Date();
    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is inactive');
    }
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('Coupon is not active yet');
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.minOrderAmount && subtotalAmount < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount is ${coupon.minOrderAmount}`,
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
      discountAmount = Math.floor((subtotalAmount * coupon.discountValue) / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
    discountAmount = Math.min(discountAmount, subtotalAmount);

    return {
      coupon,
      subtotalAmount,
      discountAmount,
      totalAmount: Math.max(0, subtotalAmount - discountAmount),
    };
  }

  private validateCouponShape(
    discountType: CouponDiscountType,
    discountValue: number,
  ): void {
    if (
      discountType === CouponDiscountType.PERCENTAGE &&
      (discountValue < 1 || discountValue > 100)
    ) {
      throw new BadRequestException(
        'Percentage coupon discountValue must be between 1 and 100',
      );
    }
    if (discountType === CouponDiscountType.FIXED && discountValue < 1) {
      throw new BadRequestException('Fixed coupon discountValue must be >= 1');
    }
  }
}
