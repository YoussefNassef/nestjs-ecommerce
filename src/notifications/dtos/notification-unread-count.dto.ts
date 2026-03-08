import { ApiProperty } from '@nestjs/swagger';

export class NotificationUnreadCountDto {
  @ApiProperty({ example: 5 })
  unreadCount: number;
}
