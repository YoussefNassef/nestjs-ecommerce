import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from 'src/products/products.entity';
import { Order } from './orders.entity';

@Entity('order_items')
export class OrderItem {
  @ApiProperty({
    description: 'Unique order item identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Order that owns this item',
    type: () => Order,
  })
  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order: Order;

  @ApiProperty({
    description: 'Product snapshot at purchase time',
    type: () => Product,
  })
  @ManyToOne(() => Product, (p) => p.orders)
  product: Product;

  @ApiProperty({
    description: 'Product price at purchase time',
    example: 49999,
  })
  @Column({ type: 'int' })
  price: number;

  @ApiProperty({
    description: 'Quantity purchased',
    example: 2,
  })
  @Column({ type: 'int' })
  quantity: number;

  /**
   * Domain helper to calculate subtotal in memory.
   */
  get subtotal(): number {
    return this.price * this.quantity;
  }

  /**
   * Domain helper to create an order item from product snapshot.
   */
  static create(params: {
    order: Order;
    product: Product;
    quantity: number;
    price: number;
  }): OrderItem {
    const item = new OrderItem();
    item.order = params.order;
    item.product = params.product;
    item.price = params.price;
    item.quantity = params.quantity;
    return item;
  }
}
