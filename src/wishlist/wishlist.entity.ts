import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/products/products.entity';
import { User } from 'src/users/user.entity';
import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wishlists')
@Index(['user', 'product'], { unique: true })
export class Wishlist {
  @ApiProperty({
    description: 'Unique wishlist item identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User who saved this wishlist item',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.wishlists, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    description: 'Product saved in wishlist',
    type: () => Product,
  })
  @ManyToOne(() => Product, (product) => product.wishlists, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ApiProperty({
    description: 'When this item was added to wishlist',
    example: '2026-03-05T11:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
