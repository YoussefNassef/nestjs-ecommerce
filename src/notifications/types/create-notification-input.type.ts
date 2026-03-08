import { NotificationType } from '../enums/notification-type.enum';

export type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
};
