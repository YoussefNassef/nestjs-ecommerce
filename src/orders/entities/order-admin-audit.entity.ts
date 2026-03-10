import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './orders.entity';
import { OrderAdminAuditAction } from '../enums/order-admin-audit-action.enum';

@Entity('order_admin_audit')
@Index('IDX_order_admin_audit_order_created_at', ['orderId', 'createdAt'])
export class OrderAdminAudit {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440111',
  })
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({
    enum: OrderAdminAuditAction,
    example: OrderAdminAuditAction.ORDER_STATUS_UPDATED,
  })
  @Column({ type: 'varchar', length: 64 })
  action: OrderAdminAuditAction;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  adminUserId: number;

  @ApiPropertyOptional({ example: 'Customer called and requested cancellation' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  note?: string | null;

  @ApiPropertyOptional({
    example: {
      fromOrderStatus: 'pending_payment',
      toOrderStatus: 'cancelled',
    },
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}

