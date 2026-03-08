import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { CartService } from 'src/cart/providers/cart.service';
import { Order } from '../entities/orders.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { OrderStatus } from '../enum/order.status.enum';
import { OrderItem } from '../entities/orders-item.entity';
import { toOrderResponseDto } from '../mappers/order-response.mapper';
import { Product } from 'src/products/products.entity';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { AddressesService } from 'src/addresses/providers/addresses.service';
import { ShippingQuoteProvider } from './shipping-quote.provider';
import { NotificationsService } from 'src/notifications/providers/notifications.service';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';

@Injectable()
export class CreateOrderProvider {
  constructor(
    private readonly cartService: CartService,
    private readonly addressesService: AddressesService,
    private readonly shippingQuoteProvider: ShippingQuoteProvider,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}
  async createOrder(user: ActiveUserData, dto: CreateOrderDto) {
    const cart = await this.cartService.getCart(user.sub);
    const validation = await this.cartService.validateCart(user.sub);
    if (!validation.valid) {
      throw new BadRequestException(
        validation.issues[0]?.message ?? 'Invalid cart',
      );
    }

    const address = await this.addressesService.getOwnedAddressForOrder(
      user.sub,
      dto.addressId,
    );

    const shipping = this.shippingQuoteProvider.getQuote(
      dto.shippingMethod,
      cart.totalPrice,
    );

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const orderRepo = manager.getRepository(Order);
      const reservationMinutes = this.configService.get<number>(
        'appConfig.orderStockReservationMinutes',
      );
      const reservationExpiresAt = new Date(
        Date.now() + (reservationMinutes ?? 15) * 60 * 1000,
      );

      // Lock product rows in deterministic order to reduce deadlock risk.
      const sortedItems = [...cart.items].sort((a, b) =>
        a.product.id.localeCompare(b.product.id),
      );

      for (const cartItem of sortedItems) {
        const product = await productRepo.findOne({
          where: { id: cartItem.product.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new BadRequestException(
            `Product not found: ${cartItem.product.id}`,
          );
        }

        if (!product.isActive) {
          throw new BadRequestException(
            `Product is not available: ${cartItem.product.id}`,
          );
        }

        if (product.stock < cartItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product: ${product.id}`,
          );
        }

        product.stock -= cartItem.quantity;
        product.reservedStock += cartItem.quantity;
        await productRepo.save(product);
      }

      const order = new Order();
      order.user = { id: user.sub } as User;
      order.status = OrderStatus.PENDING_PAYMENT;
      order.stockReserved = true;
      order.reservationExpiresAt = reservationExpiresAt;
      order.subtotalAmount = cart.items.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );
      order.discountAmount = cart.discountAmount ?? 0;
      order.couponCode = cart.coupon?.code ?? null;
      order.shippingMethod = shipping.shippingMethod;
      order.shippingCost = shipping.shippingCost;
      order.shippingEtaDays = shipping.shippingEtaDays;
      order.shippingAddressSnapshot = {
        id: address.id,
        label: address.label,
        recipientName: address.recipientName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? null,
        city: address.city,
        state: address.state ?? null,
        postalCode: address.postalCode ?? null,
        country: address.country,
      };
      order.items = cart.items.map((cartItem) =>
        OrderItem.create({
          order,
          product: cartItem.product,
          quantity: cartItem.quantity,
          price: cartItem.price,
        }),
      );

      return orderRepo.save(order);
    });

    await this.cartService.clearCart(user.sub);
    await this.notificationsService.create({
      userId: user.sub,
      type: NotificationType.ORDER_CREATED,
      title: 'تم إنشاء الطلب',
      body: `تم إنشاء طلبك بنجاح مع حجز المخزون حتى ${savedOrder.reservationExpiresAt?.toISOString() ?? 'وقت قصير'}.`,
      data: {
        orderId: savedOrder.id,
        status: savedOrder.status,
        reservationExpiresAt:
          savedOrder.reservationExpiresAt?.toISOString() ?? null,
      },
    });
    await this.notificationsService.createForAdmins({
      type: NotificationType.ORDER_CREATED,
      title: 'New order created',
      body: `Order ${savedOrder.id} was created and is waiting for payment.`,
      data: {
        orderId: savedOrder.id,
        userId: user.sub,
        status: savedOrder.status,
        totalAmount: savedOrder.totalAmount,
      },
    });

    return toOrderResponseDto(savedOrder);
  }
}
