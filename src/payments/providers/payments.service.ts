import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentStatus } from '../enums/PaymentStatus.enum';
import { CreatePaymentProvider } from './create-payment.provider';
import { GetPaymentByIdProvider } from './get-payment-by-id.provider';
import { UpdatePaymentStatusProvider } from './update-payment-status.provider';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly createPaymentProvider: CreatePaymentProvider,
    private readonly getPaymentByIdProvider: GetPaymentByIdProvider,
    private readonly updatePaymentStatusProvider: UpdatePaymentStatusProvider,
  ) {}
  async createPayment(dto: CreatePaymentDto) {
    return await this.createPaymentProvider.createPayment(dto);
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
}
