import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/auth/enums/role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';

@Entity('support_messages')
@Index('IDX_support_messages_ticket_created', ['ticketId', 'createdAt'])
export class SupportMessage {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440111',
  })
  @Column({ type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  authorUserId: number;

  @ApiProperty({ enum: Role, example: Role.USER })
  @Column({ type: 'varchar', length: 16 })
  authorRole: Role;

  @ApiProperty({
    example: 'I need an update for the order status.',
  })
  @Column({ type: 'varchar', length: 1000 })
  message: string;

  @ApiProperty({
    example: false,
    description: 'Internal admin note not visible to customer',
  })
  @Column({ type: 'boolean', default: false })
  isInternal: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
