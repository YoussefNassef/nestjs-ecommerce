import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SupportTicketCategory } from '../enums/support-ticket-category.enum';
import { SupportTicketPriority } from '../enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '../enums/support-ticket-status.enum';
import { SupportMessage } from './support-message.entity';

@Entity('support_tickets')
@Index('IDX_support_tickets_user_status', ['userId', 'status'])
@Index('IDX_support_tickets_order_id', ['orderId'])
@Index('IDX_support_tickets_assigned_admin', ['assignedAdminUserId'])
export class SupportTicket {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  userId: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  orderId?: string | null;

  @ApiProperty({
    example: 'Delayed delivery and no tracking updates',
  })
  @Column({ type: 'varchar', length: 160 })
  subject: string;

  @ApiProperty({ enum: SupportTicketStatus, example: SupportTicketStatus.OPEN })
  @Column({
    type: 'varchar',
    length: 32,
    default: SupportTicketStatus.OPEN,
  })
  status: SupportTicketStatus;

  @ApiProperty({
    enum: SupportTicketPriority,
    example: SupportTicketPriority.NORMAL,
  })
  @Column({
    type: 'varchar',
    length: 16,
    default: SupportTicketPriority.NORMAL,
  })
  priority: SupportTicketPriority;

  @ApiProperty({
    enum: SupportTicketCategory,
    example: SupportTicketCategory.ORDER,
  })
  @Column({
    type: 'varchar',
    length: 24,
    default: SupportTicketCategory.OTHER,
  })
  category: SupportTicketCategory;

  @ApiProperty({ example: 5, required: false, nullable: true })
  @Column({ type: 'int', nullable: true })
  assignedAdminUserId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  customerLastReadAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  adminLastReadAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date | null;

  @OneToMany(() => SupportMessage, (message) => message.ticket)
  messages: SupportMessage[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
