import { Product } from 'src/products/products.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cart } from './cart.entity';

@Entity('cart_items')
export class CartItem {
  @ApiProperty({
    description: 'Unique cart item identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Cart that contains this item',
    type: () => Cart,
  })
  @ManyToOne(() => Cart, (c) => c.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ApiProperty({
    description: 'Product in the cart',
    type: () => Product,
  })
  @ManyToOne(() => Product)
  @JoinColumn()
  product: Product;

  @ApiProperty({
    description: 'Quantity of product in cart',
    example: 2,
  })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({
    description: 'Price of product at the time of adding to cart',
    example: 499999,
  })
  @Column({ type: 'int' })
  price: number;

  @ApiProperty({
    description: 'Subtotal for this item (price * quantity)',
    example: 999998,
  })
  @Column({ type: 'int' })
  subtotal: number;

  /**
   * Domain helper to create a new cart item with correct subtotal.
   */
  static create(params: {
    cart: Cart;
    product: Product;
    quantity: number;
    price: number;
  }): CartItem {
    const item = new CartItem();
    item.cart = params.cart;
    item.product = params.product;
    item.quantity = params.quantity;
    item.price = params.price;
    item.subtotal = params.price * params.quantity;
    return item;
  }

  updateQuantity(quantity: number): void {
    this.quantity = quantity;
    this.subtotal = this.price * this.quantity;
  }
}
