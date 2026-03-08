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
import { ShippingMethod } from '../enums/shipping-method.enum';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { OrderTrackingEvent } from './order-tracking-event.entity';
import { ReturnRequest } from 'src/returns/return-request.entity';

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
    description: 'Whether stock is currently reserved for this order',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  stockReserved: boolean;

  @ApiProperty({
    description: 'When this stock reservation expires',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  reservationExpiresAt?: Date | null;

  @ApiProperty({
    description: 'Order subtotal before discount',
    example: 1200,
  })
  @Column({ type: 'int', default: 0 })
  subtotalAmount: number;

  @ApiProperty({
    description: 'Discount amount applied to this order',
    example: 120,
  })
  @Column({ type: 'int', default: 0 })
  discountAmount: number;

  @ApiProperty({
    description: 'Applied coupon code, if any',
    example: 'RAMADAN10',
    required: false,
    nullable: true,
  })
  @Column({ type: 'varchar', length: 64, nullable: true })
  couponCode?: string | null;

  @ApiProperty({
    description: 'Shipping method selected by customer',
    enum: ShippingMethod,
    example: ShippingMethod.STANDARD,
  })
  @Column({ type: 'varchar', length: 32, default: ShippingMethod.STANDARD })
  shippingMethod: ShippingMethod;

  @ApiProperty({
    description: 'Shipping cost amount',
    example: 30,
  })
  @Column({ type: 'int', default: 0 })
  shippingCost: number;

  @ApiProperty({
    description: 'Estimated delivery in days',
    example: 3,
  })
  @Column({ type: 'int', default: 0 })
  shippingEtaDays: number;

  @ApiProperty({
    description: 'Current delivery lifecycle status',
    enum: DeliveryStatus,
    example: DeliveryStatus.PENDING,
  })
  @Column({ type: 'varchar', length: 32, default: DeliveryStatus.PENDING })
  deliveryStatus: DeliveryStatus;

  @ApiProperty({
    description: 'Carrier tracking number',
    required: false,
    nullable: true,
    example: 'TRK-93820393',
  })
  @Column({ type: 'varchar', length: 128, nullable: true })
  trackingNumber?: string | null;

  @ApiProperty({
    description: 'Shipping carrier',
    required: false,
    nullable: true,
    example: 'Aramex',
  })
  @Column({ type: 'varchar', length: 128, nullable: true })
  shippingCarrier?: string | null;

  @ApiProperty({
    description: 'Public tracking URL',
    required: false,
    nullable: true,
    example: 'https://tracking.example.com/TRK-93820393',
  })
  @Column({ type: 'varchar', length: 2048, nullable: true })
  trackingUrl?: string | null;

  @ApiProperty({
    description: 'Optional location hint for latest tracking update',
    required: false,
    nullable: true,
    example: 'Riyadh Hub',
  })
  @Column({ type: 'varchar', length: 160, nullable: true })
  currentLocation?: string | null;

  @ApiProperty({
    description: 'Optional note associated with latest tracking update',
    required: false,
    nullable: true,
    example: 'Package sorted and moved to outbound truck',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  trackingNote?: string | null;

  @ApiProperty({
    description: 'Estimated delivery timestamp',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  estimatedDeliveryAt?: Date | null;

  @ApiProperty({
    description: 'When order was marked shipped',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  shippedAt?: Date | null;

  @ApiProperty({
    description: 'When order was marked out for delivery',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  outForDeliveryAt?: Date | null;

  @ApiProperty({
    description: 'When order was marked delivered',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date | null;

  @ApiProperty({
    description: 'Last time delivery status changed',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  deliveryStatusUpdatedAt?: Date | null;

  @ApiProperty({
    description: 'Shipping address snapshot stored at order creation',
    example: {
      recipientName: 'Ahmed Ali',
      phone: '966512345678',
      line1: 'King Fahd Rd, Building 10',
      city: 'Riyadh',
      country: 'SA',
    },
    required: false,
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  shippingAddressSnapshot?: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Payment information for this order',
    type: () => Payment,
  })
  @OneToOne(() => Payment, (p) => p.order)
  payment: Payment;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderTrackingEvent, (event) => event.order)
  trackingEvents: OrderTrackingEvent[];

  @OneToMany(() => ReturnRequest, (request) => request.order)
  returnRequests: ReturnRequest[];

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
    const subtotal =
      this.subtotalAmount ||
      items.reduce((sum, item) => sum + item.subtotal, 0);
    return (
      Math.max(0, subtotal - (this.discountAmount ?? 0)) +
      (this.shippingCost ?? 0)
    );
  }

  @ApiProperty({
    description: 'Order creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
