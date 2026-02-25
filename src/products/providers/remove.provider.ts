import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products.entity';
import { Repository } from 'typeorm';
import { FindOneProvider } from './find-one.provider';

@Injectable()
export class RemoveProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly findOneProvider: FindOneProvider,
  ) {}
  async remove(id: string): Promise<void> {
    const product = await this.findOneProvider.findOne(id);
    await this.productRepo.remove(product);
  }
}
