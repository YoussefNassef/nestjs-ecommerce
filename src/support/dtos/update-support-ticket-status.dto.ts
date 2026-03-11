import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { SupportTicketStatus } from '../enums/support-ticket-status.enum';

export class UpdateSupportTicketStatusDto {
  @ApiProperty({
    enum: SupportTicketStatus,
    example: SupportTicketStatus.IN_PROGRESS,
  })
  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus;

  @ApiPropertyOptional({
    description: 'Optional internal note attached during status update',
    example: 'Escalated to payments team for verification.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  note?: string;
}
