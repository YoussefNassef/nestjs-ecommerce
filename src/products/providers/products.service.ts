import { Injectable } from '@nestjs/common';
import { Product } from '../products.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { CreateProductProvider } from './create-product.provider';
import { FindAllProvider } from './find-all.provider';
import { FindOneProvider } from './find-one.provider';
import { UpdateProvider } from './update.provider';
import { RemoveProvider } from './remove.provider';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { UploadedImageFile } from '../types/uploaded-image-file.type';

@Injectable()
export class ProductsService {
  constructor(
    private readonly createProductProvider: CreateProductProvider,
    private readonly findAllProvider: FindAllProvider,
    private readonly findOneProvider: FindOneProvider,
    private readonly updateProvider: UpdateProvider,
    private readonly removeProvider: RemoveProvider,
  ) {}

  async createProductWithImages(
    dto: CreateProductDto,
    files: {
      mainPicture?: UploadedImageFile[];
      subPictures?: UploadedImageFile[];
    },
  ): Promise<Product> {
    return this.createProductProvider.createWithImages(dto, files);
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    return this.createProductProvider.create(dto);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    return this.findAllProvider.findAll(paginationQuery);
  }

  async findOne(id: string): Promise<Product> {
    return this.findOneProvider.findOne(id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    return this.updateProvider.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    return this.removeProvider.remove(id);
  }
}
