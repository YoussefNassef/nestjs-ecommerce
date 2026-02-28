import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './providers/categories.service';
import { CreateCategoryProvider } from './providers/create-category.provider';
import { FindAllCategoryProvider } from './providers/find-all-category.provider';
import { FindOneCategoryProvider } from './providers/find-one-category.provider';
import { UpdateCategoryProvider } from './providers/update-category.provider';
import { RemoveCategoryProvider } from './providers/remove-category.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CreateCategoryProvider,
    FindAllCategoryProvider,
    FindOneCategoryProvider,
    UpdateCategoryProvider,
    RemoveCategoryProvider,
  ],
  exports: [CategoriesService, FindOneCategoryProvider],
})
export class CategoriesModule {}
