import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateProductCommercialDto {
  @ApiPropertyOptional({
    description: 'Display name',
    example: 'iPhone 16 Pro Max',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  name?: string;

  @ApiPropertyOptional({
    description: 'Product price in smallest currency unit',
    example: 799900,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  price?: number;
}

