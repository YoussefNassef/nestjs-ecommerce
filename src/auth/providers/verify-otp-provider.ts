import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpCode } from '../otp-code.entity';
import { MoreThan, Repository } from 'typeorm';
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
    const otp = await this.otpRepo.findOne({
      where: {
        phone,
        code,
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

    const user = await this.userService.findBy<string>(phone);
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
}
