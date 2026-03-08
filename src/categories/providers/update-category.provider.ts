import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category.entity';
import { FindOneCategoryProvider } from './find-one-category.provider';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { RedisService } from 'src/redis/providers/redis.service';

@Injectable()
export class UpdateCategoryProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly findOneCategoryProvider: FindOneCategoryProvider,
    private readonly redisService: RedisService,
  ) {}

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOneCategoryProvider.findOne(id);
    Object.assign(category, dto);
    const saved = await this.categoryRepo.save(category);
    await this.redisService.deleteByPattern('cache:categories:list:*');
    return saved;
  }
}
