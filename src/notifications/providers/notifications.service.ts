import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { NotificationResponseDto } from '../dtos/notification-response.dto';
import { CreateNotificationProvider } from './create-notification.provider';
import { GetMyNotificationsProvider } from './get-my-notifications.provider';
import { GetUnreadCountProvider } from './get-unread-count.provider';
import { MarkNotificationAsReadProvider } from './mark-notification-as-read.provider';
import { MarkAllNotificationsAsReadProvider } from './mark-all-notifications-as-read.provider';
import { CreateNotificationInput } from '../types/create-notification-input.type';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly createNotificationProvider: CreateNotificationProvider,
    private readonly getMyNotificationsProvider: GetMyNotificationsProvider,
    private readonly getUnreadCountProvider: GetUnreadCountProvider,
    private readonly markNotificationAsReadProvider: MarkNotificationAsReadProvider,
    private readonly markAllNotificationsAsReadProvider: MarkAllNotificationsAsReadProvider,
  ) {}

  async create(
    input: CreateNotificationInput,
  ): Promise<NotificationResponseDto> {
    return this.createNotificationProvider.create(input);
  }

  async createForAdmins(
    input: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<number> {
    return this.createNotificationProvider.createForAdmins(input);
  }

  async getMyNotifications(
    userId: number,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    return this.getMyNotificationsProvider.getMyNotifications(
      userId,
      pagination,
    );
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.getUnreadCountProvider.getUnreadCount(userId);
  }

  async markAsRead(
    userId: number,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    return this.markNotificationAsReadProvider.markAsRead(
      userId,
      notificationId,
    );
  }

  async markAllAsRead(userId: number): Promise<{ updatedCount: number }> {
    return this.markAllNotificationsAsReadProvider.markAllAsRead(userId);
  }
}
