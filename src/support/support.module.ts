import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Order } from 'src/orders/entities/orders.entity';
import { SupportMessageRead } from './entities/support-message-read.entity';
import { SupportMessage } from './entities/support-message.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { RequireBearerHeaderGuard } from './guards/require-bearer-header.guard';
import { SupportEventsService } from './providers/support-events.service';
import { SupportService } from './providers/support.service';
import { AdminSupportController } from './admin-support.controller';
import { SupportController } from './support.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportTicket,
      SupportMessage,
      SupportMessageRead,
      Order,
    ]),
    NotificationsModule,
  ],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, SupportEventsService, RequireBearerHeaderGuard],
})
export class SupportModule {}
