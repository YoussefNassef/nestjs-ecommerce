import { Injectable } from '@nestjs/common';
import { Order } from '../entities/orders.entity';
import { OrderStatus } from '../enum/order.status.enum';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { CreateOrderProvider } from './create-order.provider';
import { GetUserOrdersProvider } from './get-user-orders.provider';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { GetOrderByIdProvider } from './get-order-by-id.provider';
import { UpdateStatusProvider } from './update-status.provider';

@Injectable()
export class OrdersService {
  constructor(
    private readonly createOrderProvider: CreateOrderProvider,
    private readonly getUserOrdersProvider: GetUserOrdersProvider,
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
    private readonly getOrderByIdProvider: GetOrderByIdProvider,
    private readonly updateStatusProvider: UpdateStatusProvider,
  ) {}

  async createOrder(user: ActiveUserData): Promise<OrderResponseDto> {
    return this.createOrderProvider.createOrder(user);
  }

  async getUserOrders(user: ActiveUserData): Promise<OrderResponseDto[]> {
    return this.getUserOrdersProvider.getUserOrders(user);
  }

  /**
   * Get the raw Order entity with all needed relations.
   * Useful for internal services like Payments that need full access
   * to the aggregate (including user, items, payment).
   */
  async getOrderEntityById(orderId: string): Promise<Order> {
    return this.getOrderEntityByIdProvider.getOrderEntityById(orderId);
  }

  async getOrderById(orderId: string): Promise<OrderResponseDto> {
    return this.getOrderByIdProvider.getOrderById(orderId);
  }

  // 🔁 Update Status (Admin / Webhook)
  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderResponseDto> {
    return this.updateStatusProvider.updateStatus(orderId, status);
  }
}
