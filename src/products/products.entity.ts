import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItem } from 'src/orders/entities/orders-item.entity';
import { Review } from 'src/reviews/review.entity';

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
    description: 'Product price in SAR',
    example: 499999,
  })
  @Column({
    type: 'int',
    nullable: false,
  })
  price: number;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Latest iPhone with advanced features',
  })
  @Column({ nullable: true })
  description?: string;

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
