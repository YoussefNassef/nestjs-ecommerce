import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Product } from '../products.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UploadedImageFile } from '../types/uploaded-image-file.type';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { RemoveProvider } from './remove.provider';

@Injectable()
export class CreateProductProvider {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly removeProvider: RemoveProvider,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create(dto);
    return this.productRepo.save(product);
  }

  async createWithImages(
    dto: CreateProductDto,
    files: {
      mainPicture?: UploadedImageFile[];
      subPictures?: UploadedImageFile[];
    },
  ): Promise<Product> {
    const mainPictureFile = files?.mainPicture?.[0];
    const subPictureFiles = files?.subPictures ?? [];

    if (!mainPictureFile) {
      throw new BadRequestException('mainPicture file is required');
    }

    if (subPictureFiles.length !== 3) {
      throw new BadRequestException(
        'subPictures must contain exactly 3 image files',
      );
    }

    const buildFileName = (field: string, originalName: string) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      return `${field}-${uniqueSuffix}${extname(originalName)}`;
    };

    const uploadsDir = join(process.cwd(), 'uploads', 'products');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const mainPictureFileName = buildFileName(
      'mainPicture',
      mainPictureFile.originalname,
    );
    const subPictureFileNames = subPictureFiles.map((file) =>
      buildFileName('subPictures', file.originalname),
    );

    dto.mainPicture = `/uploads/products/${mainPictureFileName}`;
    dto.subPictures = subPictureFileNames.map(
      (fileName) => `/uploads/products/${fileName}`,
    );

    const createdProduct = await this.create(dto);
    const writtenFiles = [mainPictureFileName, ...subPictureFileNames];

    try {
      await writeFile(
        join(uploadsDir, mainPictureFileName),
        mainPictureFile.buffer,
      );

      for (let i = 0; i < subPictureFiles.length; i += 1) {
        await writeFile(
          join(uploadsDir, subPictureFileNames[i]),
          subPictureFiles[i].buffer,
        );
      }

      return createdProduct;
    } catch {
      await this.removeProvider
        .remove(createdProduct.id)
        .catch(() => undefined);
      await Promise.all(
        writtenFiles.map((fileName) =>
          unlink(join(uploadsDir, fileName)).catch(() => undefined),
        ),
      );
      throw new InternalServerErrorException('Failed to store product images');
    }
  }
}
