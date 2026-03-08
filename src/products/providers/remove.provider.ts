import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products.entity';
import { Repository } from 'typeorm';
import { FindOneProvider } from './find-one.provider';
import { basename, join } from 'path';
import { unlink } from 'fs/promises';
import { RedisService } from 'src/redis/providers/redis.service';

@Injectable()
export class RemoveProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly findOneProvider: FindOneProvider,
    private readonly redisService: RedisService,
  ) {}
  async remove(id: string): Promise<void> {
    const product = await this.findOneProvider.findOne(id);
    const imagePaths = [
      product.mainPicture,
      ...(Array.isArray(product.subPictures) ? product.subPictures : []),
    ].filter((path): path is string => Boolean(path));

    await this.productRepo.remove(product);

    await Promise.all(
      imagePaths.map(async (imagePath) => {
        if (!imagePath.startsWith('/uploads/products/')) {
          return;
        }
        const fileName = basename(imagePath);
        const absolutePath = join(
          process.cwd(),
          'uploads',
          'products',
          fileName,
        );
        await unlink(absolutePath).catch(() => undefined);
      }),
    );

    await this.redisService.deleteByPattern('cache:products:list:*');
  }
}
