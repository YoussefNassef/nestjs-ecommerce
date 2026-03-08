import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentStatus } from '../enums/PaymentStatus.enum';
import { CreatePaymentProvider } from './create-payment.provider';
import { GetPaymentByIdProvider } from './get-payment-by-id.provider';
import { UpdatePaymentStatusProvider } from './update-payment-status.provider';
import { MoyasarResHttpProvider } from './moyasar-res-http.provider';
import { OrdersService } from 'src/orders/providers/orders.service';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly createPaymentProvider: CreatePaymentProvider,
    private readonly getPaymentByIdProvider: GetPaymentByIdProvider,
    private readonly updatePaymentStatusProvider: UpdatePaymentStatusProvider,
    private readonly moyasarResHttpProvider: MoyasarResHttpProvider,
    private readonly ordersService: OrdersService,
  ) {}
  async createPayment(
    dto: CreatePaymentDto,
    requester: ActiveUserData,
    idempotencyKey?: string,
  ) {
    return await this.createPaymentProvider.createPayment(
      dto,
      requester,
      idempotencyKey,
    );
  }

  async getPaymentById(paymentId: string) {
    return await this.getPaymentByIdProvider.getPaymentById(paymentId);
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    return await this.updatePaymentStatusProvider.updatePaymentStatus(
      paymentId,
      status,
    );
  }

  async syncPaymentStatus(identifier: string, requester?: ActiveUserData) {
    const payment =
      await this.getPaymentByIdProvider.getPaymentById(identifier);

    if (requester) {
      const isOwner = payment.order?.id
        ? Number(
            (await this.ordersService.getOrderEntityById(payment.order.id)).user
              ?.id,
          ) === Number(requester.sub)
        : false;
      const isAdmin = requester.role === Role.ADMIN;
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to sync this payment',
        );
      }
    }

    const externalPaymentId = payment.moyasarPaymentId;
    const moyasarRes =
      await this.moyasarResHttpProvider.getPaymentById(externalPaymentId);
    const remoteStatusValue =
      moyasarRes.data &&
      typeof moyasarRes.data === 'object' &&
      'status' in moyasarRes.data
        ? (moyasarRes.data as { status?: unknown }).status
        : undefined;
    const remoteStatus =
      typeof remoteStatusValue === 'string'
        ? remoteStatusValue.toLowerCase()
        : '';

    if (remoteStatus === 'paid') {
      await this.updatePaymentStatusProvider.updatePaymentStatus(
        externalPaymentId,
        PaymentStatus.PAID,
      );
      if (payment.order?.id) {
        await this.ordersService.updateStatus(
          payment.order.id,
          OrderStatus.PAID,
        );
      }
      return { paymentId: externalPaymentId, status: PaymentStatus.PAID };
    }

    if (remoteStatus === 'failed') {
      await this.updatePaymentStatusProvider.updatePaymentStatus(
        externalPaymentId,
        PaymentStatus.FAILED,
      );
      if (payment.order?.id) {
        await this.ordersService.updateStatus(
          payment.order.id,
          OrderStatus.CANCELLED,
        );
      }
      return { paymentId: externalPaymentId, status: PaymentStatus.FAILED };
    }

    return { paymentId: externalPaymentId, status: payment.status };
  }
}
