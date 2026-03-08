import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { Repository } from 'typeorm';
import { NotificationResponseDto } from '../dtos/notification-response.dto';
import { toNotificationResponseDto } from '../mappers/notification-response.mapper';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class GetMyNotificationsProvider {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async getMyNotifications(
    userId: number,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const [items, totalItems] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      items: items.map((item) => toNotificationResponseDto(item)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
