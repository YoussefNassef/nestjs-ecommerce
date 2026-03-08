import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/auth/enums/role.enum';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { toNotificationResponseDto } from '../mappers/notification-response.mapper';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationInput } from '../types/create-notification-input.type';

@Injectable()
export class CreateNotificationProvider {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = this.notificationRepo.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
      isRead: false,
    });

    const saved = await this.notificationRepo.save(notification);
    return toNotificationResponseDto(saved);
  }

  async createForAdmins(
    input: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<number> {
    const admins = await this.userRepo.find({
      where: { role: Role.ADMIN },
      select: ['id'],
    });

    if (admins.length === 0) {
      return 0;
    }

    const notifications = admins.map((admin) =>
      this.notificationRepo.create({
        userId: admin.id,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? null,
        isRead: false,
      }),
    );

    await this.notificationRepo.save(notifications);
    return notifications.length;
  }
}
