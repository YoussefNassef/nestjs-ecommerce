import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Headers,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { PaymentsService } from './providers/payments.service';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import * as activeUserDataInterface from 'src/auth/interface/active-user-data.interface';
import type { Response } from 'express';
import { PaymentStatus } from './enums/PaymentStatus.enum';
import { OrdersService } from 'src/orders/providers/orders.service';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { Roles } from 'src/auth/decorator/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import type { ReconcileSummary } from './providers/reconcile-pending-payments.provider';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('moyasar')
  @Auth(AuthType.Bearer)
  createPayment(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
    @Headers('x-idempotency-key') xIdempotencyKeyHeader?: string,
  ) {
    const idempotencyKey =
      idempotencyKeyHeader?.trim() || xIdempotencyKeyHeader?.trim();

    if (!idempotencyKey) {
      throw new BadRequestException('idempotency-key header is required');
    }
    if (idempotencyKey.length > 128) {
      throw new BadRequestException('idempotency-key is too long');
    }

    return this.paymentsService.createPayment(dto, user, idempotencyKey);
  }

  // Backward-compatible route used by older frontend builds.
  @Post('create')
  @Auth(AuthType.Bearer)
  createPaymentLegacy(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
    @Headers('x-idempotency-key') xIdempotencyKeyHeader?: string,
  ) {
    const idempotencyKey =
      idempotencyKeyHeader?.trim() || xIdempotencyKeyHeader?.trim();

    if (!idempotencyKey) {
      throw new BadRequestException('idempotency-key header is required');
    }
    if (idempotencyKey.length > 128) {
      throw new BadRequestException('idempotency-key is too long');
    }

    return this.paymentsService.createPayment(dto, user, idempotencyKey);
  }

  @Get('callback')
  @Auth(AuthType.None)
  async handleMoyasarCallback(
    @Query('id') id: string,
    @Query('status') status: string,
    @Query('message') message: string,
    @Res() res: Response,
  ) {
    const normalizedStatus = (status || '').toLowerCase();
    const normalizedMessage = (message || '').toLowerCase();
    const isSuccessfulCallback =
      normalizedStatus === 'paid' || normalizedMessage === 'approved';
    const isFailedCallback = normalizedStatus === 'failed';

    if (id) {
      try {
        await this.paymentsService.syncPaymentStatus(id);
      } catch (error) {
        try {
          await this.applyCallbackFallbackStatus(
            id,
            isSuccessfulCallback,
            isFailedCallback,
          );
        } catch (fallbackError) {
          console.error(
            'Failed to sync payment status from callback',
            error,
            fallbackError,
          );
        }
      }
    }

    const target = new URL(
      '/orders',
      process.env.FRONTEND_URL ?? 'http://localhost:4200',
    );

    if (id) {
      target.searchParams.set('paymentId', id);
    }
    if (status) {
      target.searchParams.set('status', status);
    }
    if (message) {
      target.searchParams.set('message', message);
    }

    return res.redirect(target.toString());
  }

  private async applyCallbackFallbackStatus(
    paymentIdentifier: string,
    isSuccessful: boolean,
    isFailed: boolean,
  ): Promise<void> {
    if (!isSuccessful && !isFailed) {
      return;
    }

    const payment =
      await this.paymentsService.getPaymentById(paymentIdentifier);

    if (isSuccessful) {
      await this.paymentsService.updatePaymentStatus(
        paymentIdentifier,
        PaymentStatus.PAID,
      );
      if (payment.order?.id) {
        await this.ordersService.updateStatus(
          payment.order.id,
          OrderStatus.PAID,
        );
      }
      return;
    }

    await this.paymentsService.updatePaymentStatus(
      paymentIdentifier,
      PaymentStatus.FAILED,
    );
    if (payment.order?.id) {
      await this.ordersService.updateStatus(
        payment.order.id,
        OrderStatus.CANCELLED,
      );
    }
  }

  @Get('sync')
  @Auth(AuthType.Bearer)
  @HttpCode(200)
  syncPayment(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Query('id') id: string,
  ) {
    if (!id) {
      throw new BadRequestException('Payment id is required');
    }
    return this.paymentsService.syncPaymentStatus(id, user);
  }

  @Post('reconcile')
  @Roles(Role.ADMIN)
  @HttpCode(200)
  runReconciliationNow(): Promise<ReconcileSummary> {
    return this.paymentsService.reconcilePendingPayments();
  }
}
