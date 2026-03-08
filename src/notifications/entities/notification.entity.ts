import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';

@Entity('notifications')
export class Notification {
  @ApiProperty({
    description: 'Unique notification identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.ORDER_CREATED,
  })
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'Your order has been created',
  })
  @Column({ type: 'varchar', length: 160 })
  title: string;

  @ApiProperty({
    description: 'Notification body text',
    example: 'Order #123 was created and stock is reserved for checkout.',
  })
  @Column({ type: 'varchar', length: 500 })
  body: string;

  @ApiProperty({
    description: 'Optional structured payload used by frontend routing',
    example: { orderId: '550e8400-e29b-41d4-a716-446655440000' },
    required: false,
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Whether this notification has been read',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @ApiProperty({
    description: 'Timestamp when the notification was read',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @ApiProperty({
    description: 'Notification creation timestamp',
    example: '2026-03-07T12:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
