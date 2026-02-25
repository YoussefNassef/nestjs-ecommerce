import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { OtpCode } from '../otp-code.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OtpCleanUpProvider {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
  ) {}
  @Cron('*/1 * * * *')
  async cleanExpiredOtps() {
    const now = new Date();

    await this.otpRepo.delete({
      expiresAt: LessThan(now),
    });
  }
}
