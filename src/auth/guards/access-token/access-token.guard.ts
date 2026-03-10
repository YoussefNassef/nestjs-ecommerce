/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as config from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import jwtConfig from 'src/auth/config/jwt.config';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthSession } from 'src/auth/entities/auth-session.entity';
import { Repository } from 'typeorm';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(AuthSession)
    private readonly authSessionRepo: Repository<AuthSession>,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: config.ConfigType<typeof jwtConfig>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const token =
      this.extractTokenFromHeader(request) ??
      this.extractTokenFromCookie(request, 'access_token');
    if (!token) {
      throw new UnauthorizedException('');
    }
    try {
      const payload = await this.jwtService.verifyAsync<ActiveUserData>(
        token,
        this.jwtConfiguration,
      );
      if (payload.sid) {
        const session = await this.authSessionRepo.findOne({
          where: {
            id: payload.sid,
            userId: payload.sub,
          },
        });
        if (!session || session.isRevoked || session.expiresAt <= new Date()) {
          throw new UnauthorizedException('Session is no longer active');
        }
      }
      request[REQUEST_USER_KEY] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [, token] = request.headers.authorization?.split(' ') ?? [];

    return token;
  }

  private extractTokenFromCookie(
    request: Request,
    cookieName: string,
  ): string | undefined {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(';');
    for (const cookiePart of cookies) {
      const [rawKey, ...rawValueParts] = cookiePart.trim().split('=');
      if (rawKey !== cookieName) {
        continue;
      }
      const value = rawValueParts.join('=');
      if (!value) {
        return undefined;
      }
      return decodeURIComponent(value);
    }

    return undefined;
  }
}
