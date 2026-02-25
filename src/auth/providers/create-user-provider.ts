import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { UsersService } from 'src/users/providers/users.service';
import { SendOtpProvider } from './send-otp-provider';

@Injectable()
export class CreateUserProvider {
  constructor(
    private readonly userService: UsersService,
    private readonly sendOtpProvider: SendOtpProvider,
  ) {}
  async createUser(createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    await this.sendOtpProvider.sendOtp(user.phone);
    return { message: 'OTP sent to phone' };
  }
}
