import { Order } from 'src/orders/entities/orders.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from './enums/PaymentStatus.enum';

@Entity()
export class Payment {
  @ApiProperty({
    description: 'Unique payment identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Associated order',
    type: () => Order,
  })
  @OneToOne(() => Order, (o) => o.payment)
  @JoinColumn()
  order: Order;

  @ApiProperty({
    description: 'Moyasar payment gateway identifier',
    example: 'pay_550e8400-e29b-41d4-a716-446655440000',
  })
  @Column()
  moyasarPaymentId: string;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit',
    example: 499999,
  })
  @Column('int')
  amount: number;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Raw payload from payment gateway',
    example: { gateway_response: 'success' },
  })
  @Column({ type: 'jsonb', nullable: true })
  rawPayload: any;

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
