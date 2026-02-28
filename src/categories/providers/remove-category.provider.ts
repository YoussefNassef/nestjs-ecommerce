import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category.entity';
import { FindOneCategoryProvider } from './find-one-category.provider';

@Injectable()
export class RemoveCategoryProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly findOneCategoryProvider: FindOneCategoryProvider,
  ) {}

  async remove(id: string): Promise<void> {
    const category = await this.findOneCategoryProvider.findOne(id);
    await this.categoryRepo.remove(category);
  }
}
