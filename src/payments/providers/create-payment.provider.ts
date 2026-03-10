/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrdersService } from 'src/orders/providers/orders.service';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { Role } from 'src/auth/enums/role.enum';
import { Payment } from '../payments.entity';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentStatus } from '../enums/PaymentStatus.enum';
import { MoyasarResHttpProvider } from './moyasar-res-http.provider';
import { Order } from 'src/orders/entities/orders.entity';
import { NotificationsService } from 'src/notifications/providers/notifications.service';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';

@Injectable()
export class CreatePaymentProvider {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
    private readonly moyasarHttpProvider: MoyasarResHttpProvider,
    private readonly dataSource: DataSource,
  ) {}

  async createPayment(
    dto: CreatePaymentDto,
    requester: ActiveUserData,
    idempotencyKey?: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('idempotency-key is required');
    }

    await this.ordersService.releaseExpiredReservations();

    const orderAggregate = await this.ordersService.getOrderEntityById(
      dto.orderId,
    );
    const isOwner = Number(orderAggregate.user?.id) === Number(requester.sub);
    const isAdmin = requester.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to create payment for this order',
      );
    }

    let existingPaymentUrl: string | null = null;

    // Lock order row to prevent duplicate payment creation on repeated clicks.
    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const paymentRepo = manager.getRepository(Payment);

      const paymentByIdempotency = await paymentRepo.findOne({
        where: { idempotencyKey },
        relations: ['order'],
      });

      if (paymentByIdempotency) {
        if (paymentByIdempotency.order?.id !== dto.orderId) {
          throw new BadRequestException(
            'idempotency-key already used for another order',
          );
        }

        const paymentUrl = paymentByIdempotency.rawPayload?.source
          ?.transaction_url as string | undefined;

        if (!paymentUrl) {
          throw new BadRequestException(
            'Idempotent request exists but has no payment URL',
          );
        }

        existingPaymentUrl = paymentUrl;
        return;
      }

      const order = await orderRepo.findOne({
        where: { id: dto.orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (
        order.stockReserved &&
        order.reservationExpiresAt &&
        order.reservationExpiresAt <= new Date()
      ) {
        throw new BadRequestException('Order reservation expired');
      }

      const existingPayment = await paymentRepo.findOne({
        where: { order: { id: order.id } },
      });

      if (
        order.status === OrderStatus.PAID ||
        existingPayment?.status === PaymentStatus.PAID
      ) {
        throw new BadRequestException('Order already paid');
      }

      if (order.status === OrderStatus.PAYMENT_INITIATED) {
        const paymentUrl = existingPayment?.rawPayload?.source
          ?.transaction_url as string | undefined;

        if (paymentUrl) {
          existingPaymentUrl = paymentUrl;
          return;
        }

        throw new BadRequestException('Payment is already being processed');
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new BadRequestException('Order already paid or processed');
      }

      order.status = OrderStatus.PAYMENT_INITIATED;
      await orderRepo.save(order);
    });

    if (existingPaymentUrl) {
      return { paymentUrl: existingPaymentUrl };
    }

    // Fetch full aggregate required by gateway payload.
    const order = await this.ordersService.getOrderEntityById(dto.orderId);
    const amount = order.totalAmount;

    if (!amount || amount <= 0) {
      await this.ordersService.updateStatus(
        dto.orderId,
        OrderStatus.PENDING_PAYMENT,
      );
      throw new BadRequestException('Order has no payable amount');
    }

    try {
      const moyasarRes = await this.moyasarHttpProvider.createPayment(
        amount,
        order,
        dto,
      );

      const payment = new Payment();
      payment.order = order;
      payment.moyasarPaymentId = moyasarRes.data.id;
      payment.amount = amount;
      payment.status = PaymentStatus.INITIATED;
      payment.rawPayload = moyasarRes.data;
      payment.idempotencyKey = idempotencyKey;

      await this.paymentRepo.save(payment);
      await this.notificationsService.create({
        userId: order.user.id,
        type: NotificationType.PAYMENT_INITIATED,
        title: 'تم بدء عملية الدفع',
        body: 'تم إنشاء رابط الدفع لطلبك. يمكنك الآن إكمال الدفع داخل الموقع.',
        data: {
          orderId: order.id,
          paymentId: payment.id,
          moyasarPaymentId: payment.moyasarPaymentId,
          amount,
        },
      });

      return {
        paymentUrl: moyasarRes.data.source.transaction_url,
      };
    } catch (error) {
      await this.ordersService.updateStatus(
        dto.orderId,
        OrderStatus.PENDING_PAYMENT,
      );
      throw error;
    }
  }
}
