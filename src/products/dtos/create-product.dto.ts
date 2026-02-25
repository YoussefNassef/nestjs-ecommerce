import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'iPhone 15 Pro',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Price of the product in SAR',
    example: 4999.99,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiPropertyOptional({
    description: 'Optional description of the product',
    example: 'Latest iPhone with advanced features',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
