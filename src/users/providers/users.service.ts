/* eslint-disable @typescript-eslint/no-unsafe-return */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { CreateUserProvider } from './create-user.provider';
import { FindByProvider } from './find-by.provider';
import { VerifyUserProvider } from './verify-user.provider';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';
import { OtpCode } from 'src/auth/otp-code.entity';
import { randomCode } from 'src/utils/methods';
import { RequestPhoneChangeDto } from '../dtos/request-phone-change.dto';
import { VerifyPhoneChangeDto } from '../dtos/verify-phone-change.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(OtpCode) private readonly otpRepo: Repository<OtpCode>,
    private readonly createUserProvider: CreateUserProvider,
    private readonly findByProvider: FindByProvider,
    private readonly verifyUserProvider: VerifyUserProvider,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.createUserProvider.create(createUserDto);
  }

  async findBy<T>(body: T): Promise<User> {
    return this.findByProvider.findBy(body);
  }

  async verifyUser(user: User): Promise<User> {
    return this.verifyUserProvider.verify(user);
  }

  async getCurrentUser(activeUser: ActiveUserData): Promise<User> {
    return this.findBy(activeUser.sub);
  }

  async updateCurrentUser(
    activeUser: ActiveUserData,
    dto: UpdateUserProfileDto,
  ): Promise<User> {
    const user = await this.findBy(activeUser.sub);

    if (!dto.fullName) {
      return user;
    }

    user.fullName = dto.fullName;
    return this.userRepo.save(user);
  }

  async requestPhoneChange(
    activeUser: ActiveUserData,
    dto: RequestPhoneChangeDto,
  ): Promise<{ message: string }> {
    const user = await this.findBy(activeUser.sub);

    if (dto.phone === user.phone) {
      throw new BadRequestException('New phone must be different');
    }

    const existing = await this.userRepo.findOne({
      where: { phone: dto.phone },
    });
    if (existing && existing.id !== user.id) {
      throw new BadRequestException('Phone number is already in use');
    }

    const lastOtp = await this.otpRepo.findOne({
      where: {
        phone: dto.phone,
        createdAt: MoreThan(new Date(Date.now() - 60 * 1000)),
      },
    });

    if (lastOtp) {
      throw new BadRequestException(
        'Please wait before requesting another OTP',
      );
    }

    user.pendingPhone = dto.phone;
    await this.userRepo.save(user);

    const otp = this.otpRepo.create({
      phone: dto.phone,
      code: randomCode(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      verified: false,
    });
    await this.otpRepo.save(otp);

    return { message: 'OTP sent to new phone number' };
  }

  async verifyPhoneChange(
    activeUser: ActiveUserData,
    dto: VerifyPhoneChangeDto,
  ): Promise<User> {
    const user = await this.findBy(activeUser.sub);

    if (!user.pendingPhone) {
      throw new BadRequestException('No pending phone change request');
    }

    if (user.pendingPhone !== dto.phone) {
      throw new BadRequestException('Phone does not match pending request');
    }

    const otp = await this.otpRepo.findOne({
      where: {
        phone: dto.phone,
        code: dto.code.trim(),
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

    const existing = await this.userRepo.findOne({
      where: { phone: dto.phone },
    });
    if (existing && existing.id !== user.id) {
      throw new BadRequestException('Phone number is already in use');
    }

    user.phone = user.pendingPhone;
    user.pendingPhone = null;
    user.isVerified = true;

    return this.userRepo.save(user);
  }
}
