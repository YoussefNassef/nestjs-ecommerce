import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { Order } from 'src/orders/entities/orders.entity';
import { CreatePaymentDto } from '../dtos/create-payment.dto';

@Injectable()
export class MoyasarResHttpProvider {
  async createPayment(amount: number, order: Order, dto: CreatePaymentDto) {
    try {
      return await axios.post(
        process.env.MOYASAR_BASE_URL ?? 'https://api.moyasar.com/v1/payments',
        {
          amount: Math.ceil(amount / 10) * 10,
          currency: 'SAR',
          description: `Order ${order.id}`,
          metadata: {
            orderId: order.id,
            userId: order.user.id,
          },
          source: {
            type: 'creditcard',
            name: dto.name,
            number: dto.number,
            month: dto.month,
            year: dto.year,
            cvc: dto.cvc,
          },
          callback_url: `${process.env.BACKEND_URL}/api/payments/callback`,
          redirect_url: `${process.env.FRONTEND_URL ?? 'http://localhost:4200'}/orders`,
        },
        {
          headers: {
            Authorization: this.getAuthorizationHeader(),
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      throw this.mapMoyasarError(error);
    }
  }

  async getPaymentById(paymentId: string) {
    try {
      return await axios.get(
        `${process.env.MOYASAR_BASE_URL ?? 'https://api.moyasar.com/v1/payments'}/${paymentId}`,
        {
          headers: {
            Authorization: this.getAuthorizationHeader(),
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      throw this.mapMoyasarError(error);
    }
  }

  private getAuthorizationHeader(): string {
    const secretKey = process.env.MOYASAR_SECRET_KEY;

    if (!secretKey) {
      throw new InternalServerErrorException(
        'MOYASAR_SECRET_KEY is not configured',
      );
    }

    return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
  }

  private mapMoyasarError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      const details =
        typeof responseData === 'string'
          ? responseData
          : responseData && typeof responseData === 'object'
            ? JSON.stringify(responseData)
            : error.message;

      return new BadRequestException(`Moyasar request failed: ${details}`);
    }

    return error instanceof Error
      ? error
      : new InternalServerErrorException('Unknown Moyasar error');
  }
}
