import { BadRequestException, Injectable } from '@nestjs/common';
import { SignInDto } from '../dtos/signIn-dto';
import { UsersService } from 'src/users/providers/users.service';
import { SendOtpProvider } from './send-otp-provider';

@Injectable()
export class SignInProvider {
  constructor(
    private readonly userService: UsersService,
    private readonly sendOtpProvider: SendOtpProvider,
  ) {}
  async signIn(signInDto: SignInDto) {
    const user = await this.userService.findBy(signInDto.phone);
    if (!user) {
      throw new BadRequestException('User not found. Please register first.');
    }
    await this.sendOtpProvider.sendOtp(user.phone);
    return { message: 'OTP sent to your phone.' };
  }
}
