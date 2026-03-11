import { ApiProperty } from '@nestjs/swagger';
import { SupportTicketCategory } from '../enums/support-ticket-category.enum';
import { SupportTicketPriority } from '../enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '../enums/support-ticket-status.enum';
import { SupportMessageResponseDto } from './support-message-response.dto';

export class SupportTicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: number;

  @ApiProperty({ nullable: true })
  orderId: string | null;

  @ApiProperty()
  subject: string;

  @ApiProperty({ nullable: true })
  lastMessagePreview: string | null;

  @ApiProperty({ example: 0 })
  unreadCount: number;

  @ApiProperty({ enum: SupportTicketStatus })
  status: SupportTicketStatus;

  @ApiProperty({ enum: SupportTicketPriority })
  priority: SupportTicketPriority;

  @ApiProperty({ enum: SupportTicketCategory })
  category: SupportTicketCategory;

  @ApiProperty({ nullable: true })
  assignedAdminUserId: number | null;

  @ApiProperty({ nullable: true })
  lastMessageAt: Date | null;

  @ApiProperty({ nullable: true })
  closedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SupportTicketDetailsResponseDto extends SupportTicketResponseDto {
  @ApiProperty({ type: [SupportMessageResponseDto] })
  messages: SupportMessageResponseDto[];
}
