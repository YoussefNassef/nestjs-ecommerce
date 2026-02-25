import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VerifyUserProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  async verify(user: User): Promise<User> {
    user.isVerified = true;
    return this.userRepo.save(user);
  }
}
