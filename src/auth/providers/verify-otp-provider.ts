import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpCode } from '../otp-code.entity';
import { In, MoreThan, Repository } from 'typeorm';
import { UsersService } from 'src/users/providers/users.service';
import { JwtService } from '@nestjs/jwt';
import * as config from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { ActiveUserData } from '../interface/active-user-data.interface';
import { createHash, randomUUID } from 'crypto';
import { AuthSession } from '../entities/auth-session.entity';

export interface AuthClientMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class VerifyOtpProvider {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
    @InjectRepository(AuthSession)
    private readonly authSessionRepo: Repository<AuthSession>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: config.ConfigType<typeof jwtConfig>,
  ) {}

  async verifyOtp(phone: string, code: string, metadata?: AuthClientMetadata) {
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
    }

    const sessionId = randomUUID();
    const accessTokenPayload: ActiveUserData = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      sid: sessionId,
    };

    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
      secret: this.jwtConfiguration.secret,
      expiresIn: this.jwtConfiguration.accessTokenTtl,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        ...accessTokenPayload,
        tokenType: 'refresh',
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.refreshSecret,
        expiresIn: this.jwtConfiguration.refreshTokenTtl,
      },
    );

    const refreshTokenExpiresAt = new Date(
      Date.now() + this.jwtConfiguration.refreshTokenTtl * 1000,
    );
    const authSession = this.authSessionRepo.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
      lastUsedAt: new Date(),
      userAgent: metadata?.userAgent?.trim() || null,
      ipAddress: metadata?.ipAddress?.trim() || null,
      isRevoked: false,
      revokedAt: null,
    });
    await this.authSessionRepo.save(authSession);

    // Backward compatibility with old single-session fields.
    user.refreshTokenHash = this.hashRefreshToken(refreshToken);
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await this.userService.saveUser(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  private hashRefreshToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
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
