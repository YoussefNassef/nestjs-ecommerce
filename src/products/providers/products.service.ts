import { Injectable } from '@nestjs/common';
import { Product } from '../products.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { CreateProductProvider } from './create-product.provider';
import { FindAllProvider } from './find-all.provider';
import { FindOneProvider } from './find-one.provider';
import { UpdateProvider } from './update.provider';
import { RemoveProvider } from './remove.provider';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly createProductProvider: CreateProductProvider,
    private readonly findAllProvider: FindAllProvider,
    private readonly findOneProvider: FindOneProvider,
    private readonly updateProvider: UpdateProvider,
    private readonly removeProvider: RemoveProvider,
  ) {}

  // ➕ Create (Admin)
  async createProduct(dto: CreateProductDto): Promise<Product> {
    return this.createProductProvider.create(dto);
  }

  // 📄 Get all (User / Admin)
  async findAll(): Promise<Product[]> {
    return this.findAllProvider.findAll();
  }

  async findOne(id: string): Promise<Product> {
    return this.findOneProvider.findOne(id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    return this.updateProvider.update(id, dto);
  }

  // 🗑 Delete (Admin)
  async remove(id: string): Promise<void> {
    return this.removeProvider.remove(id);
  }
}
