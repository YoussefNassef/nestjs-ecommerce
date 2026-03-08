import { ApiProperty } from '@nestjs/swagger';
import { Order } from 'src/orders/entities/orders.entity';
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
import { ReturnReason } from './enums/return-reason.enum';
import { ReturnRequestStatus } from './enums/return-request-status.enum';

@Entity('return_requests')
@Index('UQ_return_requests_order_id', ['order'], { unique: true })
export class ReturnRequest {
  @ApiProperty({
    description: 'Return request identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.returnRequests, {
    onDelete: 'CASCADE',
  })
  order: Order;

  @ManyToOne(() => User, (user) => user.returnRequests, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ApiProperty({
    description: 'Return reason selected by customer',
    enum: ReturnReason,
    example: ReturnReason.DAMAGED,
  })
  @Column({ type: 'varchar', length: 64 })
  reason: ReturnReason;

  @ApiProperty({
    description: 'Optional return details from customer',
    required: false,
    nullable: true,
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  reasonDetails?: string | null;

  @ApiProperty({
    description: 'Current return request status',
    enum: ReturnRequestStatus,
    example: ReturnRequestStatus.REQUESTED,
  })
  @Column({
    type: 'varchar',
    length: 32,
    default: ReturnRequestStatus.REQUESTED,
  })
  status: ReturnRequestStatus;

  @ApiProperty({
    description: 'Expected refund amount in smallest currency unit',
    example: 12000,
  })
  @Column({ type: 'int' })
  refundAmount: number;

  @ApiProperty({
    description: 'Optional admin note for approval/rejection/refund',
    required: false,
    nullable: true,
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  adminNote?: string | null;

  @Column({ type: 'int', nullable: true })
  handledByAdminUserId?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundInitiatedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
