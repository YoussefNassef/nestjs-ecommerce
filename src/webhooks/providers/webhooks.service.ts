import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { MoyasarWebhookPayloadDto } from '../dtos/webhookPayload.dto';
import { PaymentsService } from 'src/payments/providers/payments.service';
import { PaymentStatus } from 'src/payments/enums/PaymentStatus.enum';
import { OrdersService } from 'src/orders/providers/orders.service';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { MoyasarPaymentStatus } from '../enums/paymentStatus';
import { WebhookEvent } from '../entities/webhook-event.entity';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly orderService: OrdersService,
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepo: Repository<WebhookEvent>,
  ) {}

  verifyMoyasarSignature(rawBody: string, signatureHeader?: string): void {
    const secret = process.env.MOYASAR_WEBHOOK_SECRET;

    if (!secret) {
      throw new BadRequestException('Webhook secret is not configured');
    }

    if (!rawBody) {
      throw new BadRequestException('Missing raw webhook payload');
    }

    if (!signatureHeader) {
      throw new BadRequestException('Missing webhook signature');
    }

    const incomingSignature = signatureHeader
      .trim()
      .replace(/^sha256=/i, '')
      .toLowerCase();

    if (
      incomingSignature.length === 0 ||
      incomingSignature.length % 2 !== 0 ||
      !/^[a-f0-9]+$/.test(incomingSignature)
    ) {
      throw new BadRequestException('Invalid webhook signature format');
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const incomingBuffer = Buffer.from(incomingSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (
      incomingBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(incomingBuffer, expectedBuffer)
    ) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  async handleMoyasar(
    payload: MoyasarWebhookPayloadDto,
    idempotencyKey?: string,
  ) {
    this.ensureWebhookPayloadHasData(payload);

    const key = this.resolveWebhookIdempotencyKey(payload, idempotencyKey);
    const acquired = await this.acquireWebhookIdempotencyKey(key);

    if (!acquired) {
      return { duplicate: true };
    }

    try {
      const payment = await this.paymentsService.getPaymentById(
        payload.data.id,
      );
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const orderId = payload.data.metadata?.orderId || payment.order?.id;
      if (!orderId) {
        throw new BadRequestException('Missing order reference in webhook');
      }

      if (payment.status === PaymentStatus.PAID) {
        await this.markWebhookEventCompleted(key);
        return { duplicate: true };
      }

      switch (payload.data.status) {
        case MoyasarPaymentStatus.PAID:
          await this.paymentsService.updatePaymentStatus(
            payload.data.id,
            PaymentStatus.PAID,
          );
          await this.orderService.updateStatus(orderId, OrderStatus.PAID);
          await this.markWebhookEventCompleted(key);
          return { success: true, status: PaymentStatus.PAID };

        case MoyasarPaymentStatus.FAILED:
          await this.paymentsService.updatePaymentStatus(
            payload.data.id,
            PaymentStatus.FAILED,
          );
          await this.orderService.updateStatus(orderId, OrderStatus.CANCELLED);
          await this.markWebhookEventCompleted(key);
          return { success: true, status: PaymentStatus.FAILED };

        case MoyasarPaymentStatus.INITIATED:
          await this.markWebhookEventCompleted(key);
          return { success: true, status: payment.status };

        default:
          throw new BadRequestException(
            'Unsupported payment status in webhook',
          );
      }
    } catch (error) {
      await this.releaseWebhookIdempotencyKey(key);
      throw error;
    }
  }

  private resolveWebhookIdempotencyKey(
    payload: MoyasarWebhookPayloadDto,
    idempotencyKey?: string,
  ): string {
    const candidate = (
      idempotencyKey ??
      payload.id ??
      `${payload.data.id}:${payload.data.status}`
    ).trim();

    if (!candidate) {
      throw new BadRequestException('Missing webhook idempotency key');
    }

    return candidate;
  }

  private ensureWebhookPayloadHasData(payload: MoyasarWebhookPayloadDto): void {
    if (!payload.data || !payload.data.id || !payload.data.status) {
      throw new BadRequestException('Invalid webhook payload: missing data');
    }
  }

  private async acquireWebhookIdempotencyKey(key: string): Promise<boolean> {
    try {
      await this.webhookEventRepo.save({
        provider: 'moyasar',
        idempotencyKey: key,
        status: 'processing',
      });
      return true;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        return false;
      }
      throw error;
    }
  }

  private async markWebhookEventCompleted(key: string): Promise<void> {
    await this.webhookEventRepo.update(
      { idempotencyKey: key },
      { status: 'completed' },
    );
  }

  private async releaseWebhookIdempotencyKey(key: string): Promise<void> {
    await this.webhookEventRepo.delete({ idempotencyKey: key });
  }
}
