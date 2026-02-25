/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { CreateUserProvider } from './create-user.provider';
import { FindByProvider } from './find-by.provider';
import { VerifyUserProvider } from './verify-user.provider';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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
}
