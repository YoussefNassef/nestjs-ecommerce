import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Product UUID to review',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional review comment',
    example: 'Good value for money',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
