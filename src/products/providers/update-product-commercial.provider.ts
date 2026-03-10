import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products.entity';
import { FindOneProvider } from './find-one.provider';
import { RedisService } from 'src/redis/providers/redis.service';
import { UpdateProductCommercialDto } from '../dtos/update-product-commercial.dto';

@Injectable()
export class UpdateProductCommercialProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly findOneProvider: FindOneProvider,
    private readonly redisService: RedisService,
  ) {}

  async update(
    id: string,
    dto: UpdateProductCommercialDto,
  ): Promise<Product> {
    if (dto.name === undefined && dto.price === undefined) {
      throw new BadRequestException('At least one field is required: name or price');
    }

    const product = await this.findOneProvider.findOne(id);
    if (dto.name !== undefined) {
      product.name = dto.name;
    }
    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    const saved = await this.productRepo.save(product);
    await this.redisService.deleteByPattern('cache:products:list:*');
    return saved;
  }
}

