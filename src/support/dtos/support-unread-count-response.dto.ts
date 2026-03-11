import { ApiProperty } from '@nestjs/swagger';

export class SupportUnreadCountResponseDto {
  @ApiProperty({ example: 3 })
  unreadCount: number;
}
