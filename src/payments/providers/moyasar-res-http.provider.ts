import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Order } from 'src/orders/entities/orders.entity';
import { CreatePaymentDto } from '../dtos/create-payment.dto';

@Injectable()
export class MoyasarResHttpProvider {
  async handleMoyasarWebhook(
    amount: number,
    order: Order,
    dto: CreatePaymentDto,
  ) {
    return await axios.post(
      'https://api.moyasar.com/v1/payments',
      {
        amount: Math.ceil(amount / 10) * 10,
        currency: 'SAR',
        description: `Order ${order.id}`,
        metadata: {
          orderId: order.id,
          userId: order.user.id,
        },
        source: {
          type: 'creditcard', // يعطي رابط دفع للمستخدم
          name: dto.name,
          number: dto.number,
          month: dto.month,
          year: dto.year,
          cvc: dto.cvc,
        },
        callback_url:
          'https://indescribable-precociously-stacie.ngrok-free.dev/webhooks',
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.MOYASAR_TEST_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
