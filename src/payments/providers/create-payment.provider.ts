/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments.entity';
import { OrdersService } from 'src/orders/providers/orders.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentStatus } from '../enums/PaymentStatus.enum';
import { MoyasarResHttpProvider } from './moyasar-res-http.provider';

@Injectable()
export class CreatePaymentProvider {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly OrdersService: OrdersService,
    private readonly moyasarHttpProvider: MoyasarResHttpProvider,
  ) {}
  async createPayment(dto: CreatePaymentDto) {
    // Use the full Order entity (with user & items) for payment creation
    const order = await this.OrdersService.getOrderEntityById(dto.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order already paid or processed');
    }
    // 🟢 Call Moyasar
    const amount = order.totalAmount;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Order has no payable amount');
    }

    const moyasarRes = await this.moyasarHttpProvider.handleMoyasarWebhook(
      amount,
      order,
      dto,
    );
    // 2️⃣ Save payment locally
    const payment = new Payment();
    payment.order = order;
    payment.moyasarPaymentId = moyasarRes.data.id;
    payment.amount = amount;
    payment.status = PaymentStatus.INITIATED;
    payment.rawPayload = moyasarRes.data;

    await this.paymentRepo.save(payment);

    // 3️⃣ Return redirect URL
    return {
      paymentUrl: moyasarRes.data.source.transaction_url,
    };
  }
}
