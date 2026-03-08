import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('webhook_events')
export class WebhookEvent {
  @ApiProperty({
    description: 'Unique webhook event identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Provider name for this webhook event',
    example: 'moyasar',
  })
  @Column({ type: 'varchar', length: 32 })
  provider: string;

  @ApiProperty({
    description: 'Idempotency key used to deduplicate webhook processing',
    example: 'evt_12345',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @ApiProperty({
    description: 'Webhook processing state',
    example: 'completed',
  })
  @Column({ type: 'varchar', length: 32, default: 'processing' })
  status: 'processing' | 'completed';

  @ApiProperty({
    description: 'Event creation timestamp',
    example: '2024-01-21T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
