import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpCode } from '../otp-code.entity';
import { In, MoreThan, Repository } from 'typeorm';
import { UsersService } from 'src/users/providers/users.service';
import { JwtService } from '@nestjs/jwt';
import * as config from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { ActiveUserData } from '../interface/active-user-data.interface';

@Injectable()
export class VerifyOtpProvider {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: config.ConfigType<typeof jwtConfig>,
  ) {}

  async verifyOtp(phone: string, code: string) {
    const phoneVariants = this.getPhoneVariants(phone);
    const normalizedCode = this.normalizeOtpCode(code);

    const otp = await this.otpRepo.findOne({
      where: {
        phone: In(phoneVariants),
        code: normalizedCode,
        verified: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    otp.verified = true;
    await this.otpRepo.save(otp);

    const user = await this.userService.findBy<string>(otp.phone);
    if (!user.isVerified) {
      await this.userService.verifyUser(user);
      return { message: 'Account is verified' };
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        phone: user.phone,
        role: user.role,
      } as ActiveUserData,
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      },
    );

    return { accessToken };
  }

  private getPhoneVariants(phone: string): string[] {
    const normalized = this.normalizePhone(phone);
    const variants = new Set<string>([normalized]);

    if (normalized.startsWith('966')) {
      variants.add(`+${normalized}`);
    }
    if (normalized.startsWith('+966')) {
      variants.add(normalized.slice(1));
    }

    return Array.from(variants);
  }

  private normalizePhone(phone: string): string {
    const asciiDigits = this.toAsciiDigits(phone).replace(/\s+/g, '');
    const withoutInternationalPrefix = asciiDigits.replace(/^00/, '');
    const withoutPlus = withoutInternationalPrefix.replace(/^\+/, '');

    if (/^5\d{8}$/.test(withoutPlus)) {
      return `966${withoutPlus}`;
    }

    return withoutPlus;
  }

  private normalizeOtpCode(code: string): string {
    return this.toAsciiDigits(code).trim();
  }

  private toAsciiDigits(value: string): string {
    return value.replace(/[\u0660-\u0669]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0660),
    );
  }
}
