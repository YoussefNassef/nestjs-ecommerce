import { Injectable } from '@nestjs/common';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { Product } from '../products.entity';
import { FindOneProvider } from './find-one.provider';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UpdateProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly findOneProvider: FindOneProvider,
  ) {}
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOneProvider.findOne(id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }
}
