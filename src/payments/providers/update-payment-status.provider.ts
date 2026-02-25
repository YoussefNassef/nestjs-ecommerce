import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../payments.entity';
import { Repository } from 'typeorm';
import { PaymentStatus } from '../enums/PaymentStatus.enum';

@Injectable()
export class UpdatePaymentStatusProvider {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}
  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    const payment = await this.paymentRepo.findOne({
      where: { moyasarPaymentId: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('payment NotFound!');
    }
    payment.status = status;
    await this.paymentRepo.save(payment);
    return 'Ok';
  }
}
