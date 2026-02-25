import { Module } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { CreateUserProvider } from './providers/create-user.provider';
import { FindByProvider } from './providers/find-by.provider';
import { VerifyUserProvider } from './providers/verify-user.provider';

@Module({
  providers: [
    UsersService,
    CreateUserProvider,
    FindByProvider,
    VerifyUserProvider,
  ],
  imports: [TypeOrmModule.forFeature([User])],
  exports: [UsersService],
})
export class UsersModule {}
