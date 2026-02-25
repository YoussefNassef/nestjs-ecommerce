import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OtpCode } from '../otp-code.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { VerifyOtpProvider } from './verify-otp-provider';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { CreateUserProvider } from './create-user-provider';
import { SignInDto } from '../dtos/signIn-dto';
import { SignInProvider } from './sign-in-provider';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
    private readonly verifyOtpProvider: VerifyOtpProvider,
    private readonly createUserProvider: CreateUserProvider,
    private readonly signInProvider: SignInProvider,
  ) {}
  async register(createUserDto: CreateUserDto) {
    return this.createUserProvider.createUser(createUserDto);
  }
  async signIn(signInDto: SignInDto) {
    return this.signInProvider.signIn(signInDto);
  }
  async verifyOtp(phone: string, code: string) {
    return this.verifyOtpProvider.verifyOtp(phone, code);
  }
}
