import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ProductImagesInterceptor } from './interceptors/product-images.interceptor';
import { UploadedImageFile } from './types/uploaded-image-file.type';

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
      required: [
        'name',
        'slug',
        'sku',
        'price',
        'stock',
        'categoryId',
        'mainPicture',
        'subPictures',
      ],
      properties: {
        name: { type: 'string', example: 'iPhone 15 Pro' },
        slug: { type: 'string', example: 'iphone-15-pro' },
        sku: { type: 'string', example: 'IPH15PRO-256-BLK' },
        price: { type: 'number', example: 4999.99 },
        stock: { type: 'number', example: 25 },
        isActive: { type: 'boolean', example: true },
        categoryId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440001',
        },
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
  @UseInterceptors(ProductImagesInterceptor)
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      mainPicture?: UploadedImageFile[];
      subPictures?: UploadedImageFile[];
    },
  ) {
    return this.productService.createProductWithImages(createProductDto, files);
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
  async deleteProduct(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
