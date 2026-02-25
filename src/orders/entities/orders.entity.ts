import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../enum/order.status.enum';
import { Payment } from 'src/payments/payments.entity';
import { OrderItem } from './orders-item.entity';

@Entity('orders')
export class Order {
  @ApiProperty({
    description: 'Unique order identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User who placed the order',
    type: () => User,
  })
  @ManyToOne(() => User, (u) => u.orders)
  user: User;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PENDING_PAYMENT,
  })
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Payment information for this order',
    type: () => Payment,
  })
  @OneToOne(() => Payment, (p) => p.order)
  payment: Payment;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true })
  items: OrderItem[];

  /**
   * Aggregate helper to attach an order item.
   */
  addItem(item: OrderItem): void {
    if (!this.items) {
      this.items = [];
    }
    this.items.push(item);
  }

  /**
   * Aggregate helper to compute total amount from items.
   */
  get totalAmount(): number {
    const items = this.items ?? [];
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  @ApiProperty({
    description: 'Order creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
