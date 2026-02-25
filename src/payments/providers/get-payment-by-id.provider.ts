import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../payments.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GetPaymentByIdProvider {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}
  async getPaymentById(paymentId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { moyasarPaymentId: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }
}
