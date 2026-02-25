import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CreateUserProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const existing = await this.userRepo.findOne({
      where: { phone: createUserDto.phone },
    });
    if (existing)
      throw new BadRequestException('The user already exists, please Sign In.');
    const user = this.userRepo.create(createUserDto);
    return this.userRepo.save(user);
  }
}
