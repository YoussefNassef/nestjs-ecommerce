import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { VerifyOtpProvider } from './verify-otp-provider';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { CreateUserProvider } from './create-user-provider';
import { SignInDto } from '../dtos/signIn-dto';
import { SignInProvider } from './sign-in-provider';
import { UsersService } from 'src/users/providers/users.service';
import { JwtService } from '@nestjs/jwt';
import * as config from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { createHash } from 'crypto';
import { ActiveUserData } from '../interface/active-user-data.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthSession } from '../entities/auth-session.entity';
import { Repository } from 'typeorm';
import { AuthClientMetadata } from './verify-otp-provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly verifyOtpProvider: VerifyOtpProvider,
    private readonly createUserProvider: CreateUserProvider,
    private readonly signInProvider: SignInProvider,
    private readonly usersService: UsersService,
    @InjectRepository(AuthSession)
    private readonly authSessionRepo: Repository<AuthSession>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: config.ConfigType<typeof jwtConfig>,
  ) {}
  async register(createUserDto: CreateUserDto) {
    return this.createUserProvider.createUser(createUserDto);
  }
  async signIn(signInDto: SignInDto) {
    return this.signInProvider.signIn(signInDto);
  }
  async verifyOtp(phone: string, code: string, metadata?: AuthClientMetadata) {
    return this.verifyOtpProvider.verifyOtp(phone, code, metadata);
  }

  async refresh(refreshToken: string, metadata?: AuthClientMetadata) {
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException('Missing refresh token');
    }

    let payload: (ActiveUserData & { tokenType?: string }) | null = null;
    try {
      payload = await this.jwtService.verifyAsync<
        ActiveUserData & { tokenType?: string }
      >(refreshToken, {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!payload || payload.tokenType !== 'refresh' || !payload.sid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findBy<number>(payload.sub);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();
    const session = await this.authSessionRepo.findOne({
      where: {
        id: payload.sid,
        userId: user.id,
      },
    });

    if (
      !session ||
      session.isRevoked ||
      session.refreshTokenHash !== refreshTokenHash ||
      session.expiresAt <= now
    ) {
      throw new UnauthorizedException('Refresh session is no longer valid');
    }

    const accessPayload: ActiveUserData = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      sid: session.id,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
      secret: this.jwtConfiguration.secret,
      expiresIn: this.jwtConfiguration.accessTokenTtl,
    });

    const rotatedRefreshToken = await this.jwtService.signAsync(
      {
        ...accessPayload,
        tokenType: 'refresh',
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.refreshSecret,
        expiresIn: this.jwtConfiguration.refreshTokenTtl,
      },
    );

    const nextRefreshExpiry = new Date(
      Date.now() + this.jwtConfiguration.refreshTokenTtl * 1000,
    );
    session.refreshTokenHash = this.hashRefreshToken(rotatedRefreshToken);
    session.expiresAt = nextRefreshExpiry;
    session.lastUsedAt = now;
    session.userAgent = metadata?.userAgent?.trim() || session.userAgent;
    session.ipAddress = metadata?.ipAddress?.trim() || session.ipAddress;
    await this.authSessionRepo.save(session);

    // Backward compatibility with old single-session fields.
    user.refreshTokenHash = session.refreshTokenHash;
    user.refreshTokenExpiresAt = nextRefreshExpiry;
    await this.usersService.saveUser(user);

    return {
      accessToken,
      refreshToken: rotatedRefreshToken,
    };
  }

  async logout(userId: number, sessionId?: string) {
    if (sessionId) {
      const session = await this.authSessionRepo.findOne({
        where: { id: sessionId, userId },
      });
      if (session && !session.isRevoked) {
        session.isRevoked = true;
        session.revokedAt = new Date();
        await this.authSessionRepo.save(session);
      }
    } else {
      await this.revokeAllUserSessions(userId);
    }

    const user = await this.usersService.findBy<number>(userId);
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await this.usersService.saveUser(user);
    return { success: true };
  }

  async listSessions(userId: number, currentSessionId?: string) {
    const sessions = await this.authSessionRepo.find({
      where: { userId },
      order: { lastUsedAt: 'DESC', createdAt: 'DESC' },
      take: 20,
    });

    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isCurrent: !!currentSessionId && session.id === currentSessionId,
      isRevoked: session.isRevoked,
      revokedAt: session.revokedAt,
    }));
  }

  async revokeSession(userId: number, sessionId: string) {
    const session = await this.authSessionRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session || session.isRevoked) {
      return { success: true };
    }
    session.isRevoked = true;
    session.revokedAt = new Date();
    await this.authSessionRepo.save(session);
    return { success: true };
  }

  async revokeOtherSessions(userId: number, currentSessionId?: string) {
    const sessions = await this.authSessionRepo.find({ where: { userId } });
    const now = new Date();
    const updates = sessions
      .filter((session) => !currentSessionId || session.id !== currentSessionId)
      .filter((session) => !session.isRevoked)
      .map((session) => {
        session.isRevoked = true;
        session.revokedAt = now;
        return session;
      });
    if (updates.length > 0) {
      await this.authSessionRepo.save(updates);
    }

    return { success: true, revokedCount: updates.length };
  }

  private async revokeAllUserSessions(userId: number): Promise<void> {
    const sessions = await this.authSessionRepo.find({ where: { userId } });
    if (sessions.length === 0) {
      return;
    }
    const now = new Date();
    for (const session of sessions) {
      session.isRevoked = true;
      session.revokedAt = now;
    }
    await this.authSessionRepo.save(sessions);
  }

  private hashRefreshToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
