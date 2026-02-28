import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'iPhone 15 Pro',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Unique product slug',
    example: 'iphone-15-pro',
  })
  @IsString()
  slug: string;

  @ApiProperty({
    description: 'Unique stock keeping unit',
    example: 'IPH15PRO-256-BLK',
  })
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'Price of the product in SAR',
    example: 4999.99,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({
    description: 'Available inventory count',
    example: 25,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    description: 'Whether the product is active and visible',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Optional description of the product',
    example: 'Latest iPhone with advanced features',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Main product image path',
    example: '/uploads/products/iphone-15-pro-main.jpg',
  })
  @IsOptional()
  @IsString()
  mainPicture: string;

  @ApiProperty({
    description: 'Three secondary product image paths',
    example: [
      '/uploads/products/iphone-15-pro-1.jpg',
      '/uploads/products/iphone-15-pro-2.jpg',
      '/uploads/products/iphone-15-pro-3.jpg',
    ],
    type: [String],
    minItems: 3,
    maxItems: 3,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  subPictures: string[];

  @ApiProperty({
    description: 'Category UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  categoryId: string;
}
