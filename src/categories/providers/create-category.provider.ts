import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category.entity';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { RedisService } from 'src/redis/providers/redis.service';

@Injectable()
export class CreateCategoryProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepo.create(dto);
    const saved = await this.categoryRepo.save(category);
    await this.redisService.deleteByPattern('cache:categories:list:*');
    return saved;
  }
}
