import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../payments.entity';
import { DataSource, Repository } from 'typeorm';
import { PaymentStatus } from '../enums/PaymentStatus.enum';

@Injectable()
export class UpdatePaymentStatusProvider {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly dataSource: DataSource,
  ) {}
  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);

      const payment = await paymentRepo.findOne({
        where: { moyasarPaymentId: paymentId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!payment) {
        throw new NotFoundException('payment NotFound!');
      }

      // Idempotency: if already at requested status, skip side effects.
      if (payment.status === status) {
        return 'Ok';
      }

      if (
        payment.status === PaymentStatus.PAID &&
        status !== PaymentStatus.PAID
      ) {
        throw new BadRequestException('Cannot change status of a paid payment');
      }

      payment.status = status;
      await paymentRepo.save(payment);
      return 'Ok';
    });
  }
}
