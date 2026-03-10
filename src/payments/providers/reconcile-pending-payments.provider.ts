import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../payments.entity';
import { LessThan, Repository } from 'typeorm';
import { PaymentStatus } from '../enums/PaymentStatus.enum';
import { MoyasarResHttpProvider } from './moyasar-res-http.provider';
import { UpdatePaymentStatusProvider } from './update-payment-status.provider';
import { OrdersService } from 'src/orders/providers/orders.service';
import { OrderStatus } from 'src/orders/enum/order.status.enum';

export interface ReconcileSummary {
  scanned: number;
  paid: number;
  failed: number;
  unchanged: number;
  errors: number;
}

@Injectable()
export class ReconcilePendingPaymentsProvider {
  private readonly logger = new Logger(ReconcilePendingPaymentsProvider.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly moyasarResHttpProvider: MoyasarResHttpProvider,
    private readonly updatePaymentStatusProvider: UpdatePaymentStatusProvider,
    private readonly ordersService: OrdersService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileByCron(): Promise<void> {
    const summary = await this.reconcile();
    if (summary.scanned > 0) {
      this.logger.log(
        `Reconciliation scanned=${summary.scanned} paid=${summary.paid} failed=${summary.failed} unchanged=${summary.unchanged} errors=${summary.errors}`,
      );
    }
  }

  async reconcile(): Promise<ReconcileSummary> {
    const minAgeMinutes = Number(
      process.env.PAYMENT_RECONCILIATION_MIN_AGE_MINUTES ?? 2,
    );
    const batchSize = Number(
      process.env.PAYMENT_RECONCILIATION_BATCH_SIZE ?? 50,
    );
    const initiatedBefore = new Date(Date.now() - minAgeMinutes * 60 * 1000);

    const pending = await this.paymentRepo.find({
      where: {
        status: PaymentStatus.INITIATED,
        createdAt: LessThan(initiatedBefore),
      },
      relations: ['order'],
      order: { createdAt: 'ASC' },
      take: batchSize,
    });

    const summary: ReconcileSummary = {
      scanned: pending.length,
      paid: 0,
      failed: 0,
      unchanged: 0,
      errors: 0,
    };

    for (const payment of pending) {
      try {
        const remote = await this.moyasarResHttpProvider.getPaymentById(
          payment.moyasarPaymentId,
        );
        const remoteStatusValue =
          remote.data &&
          typeof remote.data === 'object' &&
          'status' in remote.data
            ? (remote.data as { status?: unknown }).status
            : undefined;
        const remoteStatus =
          typeof remoteStatusValue === 'string'
            ? remoteStatusValue.toLowerCase()
            : '';

        if (remoteStatus === 'paid') {
          await this.updatePaymentStatusProvider.updatePaymentStatus(
            payment.moyasarPaymentId,
            PaymentStatus.PAID,
          );
          if (payment.order?.id) {
            await this.ordersService.updateStatus(
              payment.order.id,
              OrderStatus.PAID,
            );
          }
          summary.paid += 1;
          continue;
        }

        if (remoteStatus === 'failed') {
          await this.updatePaymentStatusProvider.updatePaymentStatus(
            payment.moyasarPaymentId,
            PaymentStatus.FAILED,
          );
          if (payment.order?.id) {
            await this.ordersService.updateStatus(
              payment.order.id,
              OrderStatus.CANCELLED,
            );
          }
          summary.failed += 1;
          continue;
        }

        summary.unchanged += 1;
      } catch (error) {
        summary.errors += 1;
        this.logger.warn(
          `Failed to reconcile payment ${payment.moyasarPaymentId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return summary;
  }
}
