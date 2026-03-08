import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from './notification-response.dto';

class NotificationPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 37 })
  totalItems: number;

  @ApiProperty({ example: 4 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: () => [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty({ type: () => NotificationPaginationMetaDto })
  meta: NotificationPaginationMetaDto;
}
