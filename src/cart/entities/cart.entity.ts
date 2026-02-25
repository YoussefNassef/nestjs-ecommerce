import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  @ApiProperty({
    description: 'Unique cart identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User who owns the cart',
    type: () => User,
  })
  @ManyToOne(() => User, (u) => u.cart, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ApiProperty({
    description: 'Items in the cart',
    type: () => [CartItem],
  })
  @OneToMany(() => CartItem, (ci) => ci.cart, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  items: CartItem[];

  @ApiProperty({
    description: 'Total price of cart items',
    example: 999999,
  })
  @Column({ type: 'int', default: 0 })
  totalPrice: number;

  @ApiProperty({
    description: 'Number of items in cart',
    example: 5,
  })
  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @ApiProperty({
    description: 'When the cart was created',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'When the cart was last updated',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Recalculate `totalPrice` and `totalItems` based on current items.
   * This keeps the aggregate's derived state consistent.
   */
  recalculateTotals(): void {
    const items = this.items ?? [];
    this.totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
