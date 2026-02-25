import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { CartService } from 'src/cart/providers/cart.service';
import { Order } from '../entities/orders.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { OrderStatus } from '../enum/order.status.enum';
import { OrderItem } from '../entities/orders-item.entity';
import { toOrderResponseDto } from '../mappers/order-response.mapper';

@Injectable()
export class CreateOrderProvider {
  constructor(
    private readonly cartService: CartService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}
  async createOrder(user: ActiveUserData) {
    const cart = await this.cartService.getCart(user.sub);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const order = new Order();
    order.user = { id: user.sub } as User;
    order.status = OrderStatus.PENDING_PAYMENT;

    order.items = cart.items.map((cartItem) =>
      OrderItem.create({
        order,
        product: cartItem.product,
        quantity: cartItem.quantity,
        price: cartItem.price,
      }),
    );

    const savedOrder = await this.orderRepo.save(order);

    await this.cartService.clearCart(user.sub);

    return toOrderResponseDto(savedOrder);
  }
}
