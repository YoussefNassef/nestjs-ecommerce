import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { User } from 'src/users/user.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './providers/notifications.service';
import { CreateNotificationProvider } from './providers/create-notification.provider';
import { GetMyNotificationsProvider } from './providers/get-my-notifications.provider';
import { GetUnreadCountProvider } from './providers/get-unread-count.provider';
import { MarkNotificationAsReadProvider } from './providers/mark-notification-as-read.provider';
import { MarkAllNotificationsAsReadProvider } from './providers/mark-all-notifications-as-read.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    CreateNotificationProvider,
    GetMyNotificationsProvider,
    GetUnreadCountProvider,
    MarkNotificationAsReadProvider,
    MarkAllNotificationsAsReadProvider,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
