/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from 'src/products/products.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reviews')
@Index(['user', 'product'], { unique: true })
export class Review {
  @ApiProperty({
    description: 'Unique review identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Review rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @Column({ type: 'int' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional user comment',
    example: 'Excellent quality and fast delivery',
  })
  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @ApiProperty({
    description: 'User who created this review',
    type: () => User,
  })
  @ManyToOne(() => User, (u) => u.reviews, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    description: 'Reviewed product',
    type: () => Product,
  })
  @ManyToOne(() => Product, (p) => p.reviews, { onDelete: 'CASCADE' })
  product: Product;

  @ApiProperty({
    description: 'Review creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Review update timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
