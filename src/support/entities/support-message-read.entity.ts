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
import { SupportMessage } from './support-message.entity';

@Entity('support_message_reads')
@Index('IDX_support_message_reads_user_ticket', ['userId', 'ticketId'])
@Index('UQ_support_message_reads_message_user', ['messageId', 'userId'], {
  unique: true,
})
export class SupportMessageRead {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440111',
  })
  @Column({ type: 'uuid' })
  messageId: string;

  @ManyToOne(() => SupportMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: SupportMessage;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440222',
  })
  @Column({ type: 'uuid' })
  ticketId: string;

  @ApiProperty({ example: 10 })
  @Column({ type: 'int' })
  userId: number;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  @Column({ type: 'varchar', length: 16 })
  readerRole: Role;

  @ApiProperty()
  @CreateDateColumn()
  readAt: Date;
}
