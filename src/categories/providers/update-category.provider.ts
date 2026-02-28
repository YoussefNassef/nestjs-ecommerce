import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category.entity';
import { FindOneCategoryProvider } from './find-one-category.provider';
import { UpdateCategoryDto } from '../dtos/update-category.dto';

@Injectable()
export class UpdateCategoryProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly findOneCategoryProvider: FindOneCategoryProvider,
  ) {}

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOneCategoryProvider.findOne(id);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }
}
