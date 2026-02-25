import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MoyasarWebhookPayloadDto } from '../dtos/webhookPayload.dto';
import { PaymentsService } from 'src/payments/providers/payments.service';
import { PaymentStatus } from 'src/payments/enums/PaymentStatus.enum';
import { OrdersService } from 'src/orders/providers/orders.service';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { MoyasarPaymentStatus } from '../enums/paymentStatus';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly orderService: OrdersService,
  ) {}
  async handleMoyasar(payload: MoyasarWebhookPayloadDto) {
    const payment = await this.paymentsService.getPaymentById(payload.data.id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payload.data.status !== MoyasarPaymentStatus.PAID) {
      await this.paymentsService.updatePaymentStatus(
        payload.data.id,
        PaymentStatus.FAILED,
      );
      await this.orderService.updateStatus(
        payload.data.metadata?.orderId || '',
        OrderStatus.CANCELLED,
      );
      throw new BadRequestException('Paid failed');
    }

    // 🛑 Idempotency
    if (payment.status === PaymentStatus.PAID) {
      return { duplicate: true };
    }

    // ✅ Update payment
    await this.paymentsService.updatePaymentStatus(
      payload.data.id,
      PaymentStatus.PAID,
    );

    // ✅ Update order
    await this.orderService.updateStatus(
      payload.data.metadata?.orderId || '',
      OrderStatus.PAID,
    );

    return { success: true };
  }
}
