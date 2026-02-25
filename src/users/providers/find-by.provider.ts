import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FindByProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  async findBy<T>(body: T): Promise<any> {
    let user;
    if (typeof body === 'string') {
      user = await this.userRepo.findOne({ where: { phone: body } });
    }
    if (typeof body === 'number') {
      user = await this.userRepo.findOne({ where: { id: body } });
    }
    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
