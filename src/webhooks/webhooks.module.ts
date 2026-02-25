import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './providers/webhooks.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  providers: [WebhooksService],
  controllers: [WebhooksController],
  imports: [PaymentsModule, OrdersModule],
})
export class WebhooksModule {}
