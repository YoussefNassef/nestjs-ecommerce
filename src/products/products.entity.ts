import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItem } from 'src/orders/entities/orders-item.entity';
import { Review } from 'src/reviews/review.entity';
import { Category } from 'src/categories/category.entity';

@Entity()
export class Product {
  @ApiProperty({
    description: 'Unique product identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
    maxLength: 512,
  })
  @Column({
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  name: string;

  @ApiProperty({
    description: 'Unique product slug',
    example: 'iphone-15-pro',
  })
  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 256,
    nullable: true,
  })
  slug: string;

  @ApiProperty({
    description: 'Unique stock keeping unit',
    example: 'IPH15PRO-256-BLK',
  })
  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  sku: string;

  @ApiProperty({
    description: 'Product price in SAR',
    example: 499999,
  })
  @Column({
    type: 'int',
    nullable: false,
  })
  price: number;

  @ApiProperty({
    description: 'Available inventory count',
    example: 25,
    minimum: 0,
  })
  @Column({
    type: 'int',
    default: 0,
  })
  stock: number;

  @ApiProperty({
    description: 'Whether the product is active and visible',
    example: true,
  })
  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Latest iPhone with advanced features',
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Main product image URL',
    example: 'https://cdn.example.com/products/iphone-15-pro/main.jpg',
  })
  @Column({
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  mainPicture: string;

  @ApiProperty({
    description: 'Three secondary product image URLs',
    example: [
      'https://cdn.example.com/products/iphone-15-pro/1.jpg',
      'https://cdn.example.com/products/iphone-15-pro/2.jpg',
      'https://cdn.example.com/products/iphone-15-pro/3.jpg',
    ],
    type: [String],
  })
  @Column({
    type: 'simple-json',
    nullable: true,
  })
  subPictures: string[];

  @ApiProperty({
    description: 'Category ID this product belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Column({
    type: 'uuid',
    nullable: true,
  })
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Product category',
    type: () => Category,
  })
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @ApiProperty({
    description: 'Orders containing this product',
    type: () => [OrderItem],
  })
  @OneToMany(() => OrderItem, (oi) => oi.product)
  orders: OrderItem[];

  @ApiProperty({
    description: 'Reviews for this product',
    type: () => [Review],
  })
  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];
}
