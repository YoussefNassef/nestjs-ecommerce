import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { SupportTicketCategory } from '../enums/support-ticket-category.enum';
import { SupportTicketPriority } from '../enums/support-ticket-priority.enum';

export class CreateSupportTicketDto {
  @ApiProperty({
    description: 'Support ticket subject',
    example: 'Issue with payment confirmation',
  })
  @IsString()
  @Length(3, 160)
  subject: string;

  @ApiProperty({
    description: 'Initial support ticket message',
    example: 'Payment was deducted but the order is still pending.',
  })
  @IsString()
  @Length(3, 1000)
  message: string;

  @ApiPropertyOptional({
    description: 'Related order id if this ticket is order-specific',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    enum: SupportTicketPriority,
    example: SupportTicketPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiPropertyOptional({
    enum: SupportTicketCategory,
    example: SupportTicketCategory.PAYMENT,
  })
  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;
}
