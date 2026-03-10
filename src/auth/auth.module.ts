import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpCode } from './otp-code.entity';
import { SendOtpProvider } from './providers/send-otp-provider';
import { OtpHttpProvider } from './providers/otp-http-provider';
import { VerifyOtpProvider } from './providers/verify-otp-provider';
import { CreateUserProvider } from './providers/create-user-provider';
import { UsersModule } from 'src/users/users.module';
import { SignInProvider } from './providers/sign-in-provider';
import { OtpCleanUpProvider } from './providers/otp-clean-up-provider';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { AuthSession } from './entities/auth-session.entity';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SendOtpProvider,
    OtpHttpProvider,
    VerifyOtpProvider,
    CreateUserProvider,
    SignInProvider,
    OtpCleanUpProvider,
  ],
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([OtpCode, AuthSession]),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
})
export class AuthModule {}
