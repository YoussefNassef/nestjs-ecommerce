import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './providers/products.service';
import { Product } from './products.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateProductProvider } from './providers/create-product.provider';
import { FindAllProvider } from './providers/find-all.provider';
import { FindOneProvider } from './providers/find-one.provider';
import { UpdateProvider } from './providers/update.provider';
import { RemoveProvider } from './providers/remove.provider';
import { Category } from 'src/categories/category.entity';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, CreateProductProvider, FindAllProvider, FindOneProvider, UpdateProvider, RemoveProvider],
  imports: [TypeOrmModule.forFeature([Product, Category])],
  exports: [ProductsService],
})
export class ProductsModule {}
