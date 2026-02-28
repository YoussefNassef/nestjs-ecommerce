import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from 'src/products/products.entity';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Category {
  @ApiProperty({
    description: 'Unique category identifier',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Smartphones',
  })
  @Column({ type: 'varchar', length: 256 })
  name: string;

  @ApiProperty({
    description: 'Unique category slug',
    example: 'smartphones',
  })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 256 })
  slug: string;

  @ApiPropertyOptional({
    description: 'Optional category description',
    example: 'Latest phones and accessories',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Whether the category is active',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Products in this category',
    type: () => [Product],
  })
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
