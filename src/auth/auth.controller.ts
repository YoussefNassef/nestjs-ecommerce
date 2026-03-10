import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './providers/auth.service';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { SignInDto } from './dtos/signIn-dto';
import { Auth } from './decorator/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import type { Request, Response } from 'express';
import { ActiveUser } from './decorator/active-user.decorator';
import type { ActiveUserData } from './interface/active-user-data.interface';
import { randomBytes } from 'crypto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  private readonly csrfCookieName = 'csrf_token';
  private readonly accessCookieName = 'access_token';
  private readonly refreshCookieName = 'refresh_token';

  @Post('register')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered and OTP sent',
    schema: {
      example: {
        message: 'OTP sent to phone',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('signIn')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Sign in with phone number' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      example: {
        message: 'OTP sent successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('verify-otp')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      example: {
        message: 'OTP verified successfully',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          fullName: 'John Doe',
          phone: '966512345678',
          isVerified: true,
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP code' })
  @ApiResponse({ status: 401, description: 'OTP expired or invalid' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.verifyOtp(dto.phone, dto.code, {
      userAgent: this.readUserAgent(req),
      ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
    });
    this.setAccessCookie(res, tokens.accessToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    this.setCsrfCookie(res, this.generateCsrfToken());
    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully',
    schema: { example: { accessToken: 'eyJ...' } },
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.readCookie(req, this.refreshCookieName);
    const tokens = await this.authService.refresh(refreshToken ?? '', {
      userAgent: this.readUserAgent(req),
      ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
    });
    this.setAccessCookie(res, tokens.accessToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    this.setCsrfCookie(res, this.generateCsrfToken());
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: { example: { success: true } },
  })
  async logout(
    @ActiveUser() user: ActiveUserData,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(user.sub, user.sid);
    this.clearCsrfCookie(res);
    this.clearAccessCookie(res);
    this.clearRefreshCookie(res);
    return result;
  }

  @Get('csrf')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Issue CSRF token cookie' })
  @ApiResponse({
    status: 200,
    description: 'CSRF token issued',
    schema: { example: { csrfToken: 'random-token' } },
  })
  issueCsrf(@Res({ passthrough: true }) res: Response) {
    const token = this.generateCsrfToken();
    this.setCsrfCookie(res, token);
    return { csrfToken: token };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List current user sessions/devices' })
  @ApiResponse({
    status: 200,
    description: 'Active sessions listed',
  })
  listSessions(@ActiveUser() user: ActiveUserData) {
    return this.authService.listSessions(user.sub, user.sid);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke one session/device' })
  revokeSession(
    @ActiveUser() user: ActiveUserData,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(user.sub, sessionId);
  }

  @Post('sessions/logout-others')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all other devices' })
  revokeOtherSessions(@ActiveUser() user: ActiveUserData) {
    return this.authService.revokeOtherSessions(user.sub, user.sid);
  }

  private setCsrfCookie(res: Response, csrfToken: string): void {
    const accessTtlSeconds = Number(process.env.JWT_ACCESS_TOKEN_TTL ?? 900);
    res.cookie(this.csrfCookieName, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTtlSeconds * 1000,
      path: '/api',
    });
  }

  private setAccessCookie(res: Response, accessToken: string): void {
    const accessTtlSeconds = Number(process.env.JWT_ACCESS_TOKEN_TTL ?? 3600);
    res.cookie(this.accessCookieName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTtlSeconds * 1000,
      path: '/api',
    });
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    const refreshTtlSeconds = Number(process.env.JWT_REFRESH_TOKEN_TTL ?? 2592000);
    res.cookie(this.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTtlSeconds * 1000,
      path: '/api/auth',
    });
  }

  private clearAccessCookie(res: Response): void {
    res.clearCookie(this.accessCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api',
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(this.refreshCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });
  }

  private clearCsrfCookie(res: Response): void {
    res.clearCookie(this.csrfCookieName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api',
    });
  }

  private generateCsrfToken(): string {
    return randomBytes(24).toString('hex');
  }

  private readUserAgent(req: Request): string | null {
    const header = req.headers['user-agent'];
    if (typeof header === 'string') {
      return header;
    }
    return null;
  }

  private readCookie(req: Request, name: string): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(';');
    for (const cookiePart of cookies) {
      const [rawKey, ...rawValueParts] = cookiePart.trim().split('=');
      if (rawKey !== name) {
        continue;
      }
      const value = rawValueParts.join('=');
      return decodeURIComponent(value);
    }

    return undefined;
  }
}
