import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class MarkAllNotificationsAsReadProvider {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async markAllAsRead(userId: number): Promise<{ updatedCount: number }> {
    const unread = await this.notificationRepo.find({
      where: { userId, isRead: false },
    });

    if (unread.length === 0) {
      return { updatedCount: 0 };
    }

    const now = new Date();
    for (const notification of unread) {
      notification.isRead = true;
      notification.readAt = now;
    }

    await this.notificationRepo.save(unread);
    return { updatedCount: unread.length };
  }
}
