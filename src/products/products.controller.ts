/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductsService } from './providers/products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { Roles } from 'src/auth/decorator/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './products.entity';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';

const productUploadsDir = join(process.cwd(), 'uploads', 'products');
if (!existsSync(productUploadsDir)) {
  mkdirSync(productUploadsDir, { recursive: true });
}

type UploadedImageFile = {
  fieldname: string;
  originalname: string;
  mimetype: string;
  filename: string;
  buffer: Buffer;
};

const imageFileFilter = (
  _: unknown,
  file: UploadedImageFile,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new BadRequestException('Only image files are allowed'), false);
    return;
  }
  cb(null, true);
};

@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Post()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'price', 'mainPicture', 'subPictures'],
      properties: {
        name: { type: 'string', example: 'iPhone 15 Pro' },
        price: { type: 'number', example: 4999.99 },
        description: {
          type: 'string',
          example: 'Latest iPhone with advanced features',
        },
        mainPicture: { type: 'string', format: 'binary' },
        subPictures: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: Product,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'mainPicture', maxCount: 1 },
        { name: 'subPictures', maxCount: 3 },
      ],
      {
        storage: memoryStorage(),
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
      },
    ),
  )
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      mainPicture?: UploadedImageFile[];
      subPictures?: UploadedImageFile[];
    },
  ) {
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

    const mainPictureFileName = buildFileName(
      'mainPicture',
      mainPictureFile.originalname,
    );
    const subPictureFileNames = subPictureFiles.map((file) =>
      buildFileName('subPictures', file.originalname),
    );

    createProductDto.mainPicture = `/uploads/products/${mainPictureFileName}`;
    createProductDto.subPictures = subPictureFileNames.map(
      (fileName) => `/uploads/products/${fileName}`,
    );

    const createdProduct =
      await this.productService.createProduct(createProductDto);

    const writtenFiles = [mainPictureFileName, ...subPictureFileNames];

    try {
      await writeFile(
        join(productUploadsDir, mainPictureFileName),
        mainPictureFile.buffer,
      );

      for (let i = 0; i < subPictureFiles.length; i += 1) {
        await writeFile(
          join(productUploadsDir, subPictureFileNames[i]),
          subPictureFiles[i].buffer,
        );
      }
    } catch {
      await this.productService
        .remove(createdProduct.id)
        .catch(() => undefined);
      await Promise.all(
        writtenFiles.map((fileName) =>
          unlink(join(productUploadsDir, fileName)).catch(() => undefined),
        ),
      );
      throw new InternalServerErrorException('Failed to store product images');
    }

    return createdProduct;
  }

  @Get()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of all products',
    type: [Product],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getProduct(@Query() paginationQuery: PaginationQueryDto) {
    return this.productService.findAll(paginationQuery);
  }

  @Get(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: Product,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getOneProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: Product,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async DeleteProduct(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
