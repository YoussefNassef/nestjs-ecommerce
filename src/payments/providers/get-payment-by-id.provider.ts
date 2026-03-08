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
  async getPaymentById(identifier: string) {
    let payment = await this.paymentRepo.findOne({
      where: { moyasarPaymentId: identifier },
      relations: ['order'],
    });

    if (!payment) {
      payment = await this.paymentRepo.findOne({
        where: { id: identifier },
        relations: ['order'],
      });
    }

    if (!payment) {
      payment = await this.paymentRepo.findOne({
        where: { order: { id: identifier } },
        relations: ['order'],
      });
    }

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}
