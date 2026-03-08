import { Module } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { CreateUserProvider } from './providers/create-user.provider';
import { FindByProvider } from './providers/find-by.provider';
import { VerifyUserProvider } from './providers/verify-user.provider';
import { UsersController } from './users.controller';
import { OtpCode } from 'src/auth/otp-code.entity';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    CreateUserProvider,
    FindByProvider,
    VerifyUserProvider,
  ],
  imports: [TypeOrmModule.forFeature([User, OtpCode])],
  exports: [UsersService],
})
export class UsersModule {}
