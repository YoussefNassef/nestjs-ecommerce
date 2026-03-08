import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { NotificationListResponseDto } from './dtos/notification-list-response.dto';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { NotificationUnreadCountDto } from './dtos/notification-unread-count.dto';
import { NotificationsService } from './providers/notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Auth(AuthType.Bearer)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: NotificationListResponseDto,
  })
  getMyNotifications(
    @ActiveUser() activeUser: ActiveUserData,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.notificationsService.getMyNotifications(
      activeUser.sub,
      pagination,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get current user unread notifications count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    type: NotificationUnreadCountDto,
  })
  async getUnreadCount(
    @ActiveUser() activeUser: ActiveUserData,
  ): Promise<NotificationUnreadCountDto> {
    const unreadCount = await this.notificationsService.getUnreadCount(
      activeUser.sub,
    );
    return { unreadCount };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all current user notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: { example: { updatedCount: 4 } },
  })
  markAllAsRead(@ActiveUser() activeUser: ActiveUserData) {
    return this.notificationsService.markAllAsRead(activeUser.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({
    name: 'id',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  markAsRead(
    @ActiveUser() activeUser: ActiveUserData,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ) {
    return this.notificationsService.markAsRead(activeUser.sub, notificationId);
  }
}
