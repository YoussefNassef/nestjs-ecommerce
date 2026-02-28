import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { Category } from '../category.entity';
import { CreateCategoryProvider } from './create-category.provider';
import { FindAllCategoryProvider } from './find-all-category.provider';
import { FindOneCategoryProvider } from './find-one-category.provider';
import { UpdateCategoryProvider } from './update-category.provider';
import { RemoveCategoryProvider } from './remove-category.provider';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly createCategoryProvider: CreateCategoryProvider,
    private readonly findAllCategoryProvider: FindAllCategoryProvider,
    private readonly findOneCategoryProvider: FindOneCategoryProvider,
    private readonly updateCategoryProvider: UpdateCategoryProvider,
    private readonly removeCategoryProvider: RemoveCategoryProvider,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.createCategoryProvider.create(dto);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Category>> {
    return this.findAllCategoryProvider.findAll(paginationQuery);
  }

  async findOne(id: string): Promise<Category> {
    return this.findOneCategoryProvider.findOne(id);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    return this.updateCategoryProvider.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    return this.removeCategoryProvider.remove(id);
  }
}
