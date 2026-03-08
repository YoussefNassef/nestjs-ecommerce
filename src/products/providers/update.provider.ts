import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { Product } from '../products.entity';
import { FindOneProvider } from './find-one.provider';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/categories/category.entity';
import { RedisService } from 'src/redis/providers/redis.service';

@Injectable()
export class UpdateProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly findOneProvider: FindOneProvider,
    private readonly redisService: RedisService,
  ) {}
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }
    const product = await this.findOneProvider.findOne(id);
    Object.assign(product, dto);
    const saved = await this.productRepo.save(product);
    await this.redisService.deleteByPattern('cache:products:list:*');
    return saved;
  }
}
