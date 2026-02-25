import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpCode } from '../otp-code.entity';
import { MoreThan, Repository } from 'typeorm';
import { randomCode } from 'src/utils/methods';
import { OtpHttpProvider } from './otp-http-provider';

@Injectable()
export class SendOtpProvider {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
    private readonly otpHttpProvider: OtpHttpProvider,
  ) {}
  async sendOtp(phone: string) {
    const code = randomCode();

    const lastOtp = await this.otpRepo.findOne({
      where: {
        phone,
        createdAt: MoreThan(new Date(Date.now() - 60 * 1000)),
      },
    });

    const otp = this.otpRepo.create({
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await this.otpRepo.save(otp);

    const data = {
      method: 'sms',
      phone: phone, // +9665XXXXXXXX
      template_id: 8,
      fallback_email: 'email@test.test',
      otp: code,
    };

    if (lastOtp) {
      throw new BadRequestException(
        'Please wait before requesting another OTP',
      );
    }
    // await this.otpHttpProvider.OtpHttp(data);
    return { success: true };
  }
}
