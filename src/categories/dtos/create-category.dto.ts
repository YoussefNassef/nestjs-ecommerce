import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Smartphones',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Unique category slug',
    example: 'smartphones',
  })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    description: 'Optional category description',
    example: 'Latest phones and accessories',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
