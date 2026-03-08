import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './providers/webhooks.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { OrdersModule } from 'src/orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from './entities/webhook-event.entity';

@Module({
  providers: [WebhooksService],
  controllers: [WebhooksController],
  imports: [
    PaymentsModule,
    OrdersModule,
    TypeOrmModule.forFeature([WebhookEvent]),
  ],
})
export class WebhooksModule {}
