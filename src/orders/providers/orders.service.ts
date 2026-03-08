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
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { QuoteOrderProvider } from './quote-order.provider';
import { OrderQuoteResponseDto } from '../dtos/order-quote-response.dto';
import { UpdateDeliveryTrackingProvider } from './update-delivery-tracking.provider';
import { UpdateDeliveryTrackingDto } from '../dtos/update-delivery-tracking.dto';
import { GetOrderTrackingProvider } from './get-order-tracking.provider';
import { DeliveryTrackingResponseDto } from '../dtos/delivery-tracking-response.dto';
import { ReleaseExpiredReservationsProvider } from './release-expired-reservations.provider';

@Injectable()
export class OrdersService {
  constructor(
    private readonly createOrderProvider: CreateOrderProvider,
    private readonly getUserOrdersProvider: GetUserOrdersProvider,
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
    private readonly getOrderByIdProvider: GetOrderByIdProvider,
    private readonly updateStatusProvider: UpdateStatusProvider,
    private readonly quoteOrderProvider: QuoteOrderProvider,
    private readonly updateDeliveryTrackingProvider: UpdateDeliveryTrackingProvider,
    private readonly getOrderTrackingProvider: GetOrderTrackingProvider,
    private readonly releaseExpiredReservationsProvider: ReleaseExpiredReservationsProvider,
  ) {}

  async createOrder(
    user: ActiveUserData,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.createOrderProvider.createOrder(user, dto);
  }

  async quoteOrder(
    user: ActiveUserData,
    dto: CreateOrderDto,
  ): Promise<OrderQuoteResponseDto> {
    return this.quoteOrderProvider.quote(user, dto);
  }

  async getUserOrders(
    user: ActiveUserData,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<OrderResponseDto>> {
    return this.getUserOrdersProvider.getUserOrders(user, paginationQuery);
  }

  /**
   * Get the raw Order entity with all needed relations.
   * Useful for internal services like Payments that need full access
   * to the aggregate (including user, items, payment).
   */
  async getOrderEntityById(orderId: string): Promise<Order> {
    return this.getOrderEntityByIdProvider.getOrderEntityById(orderId);
  }

  async getOrderById(
    orderId: string,
    user: ActiveUserData,
  ): Promise<OrderResponseDto> {
    return this.getOrderByIdProvider.getOrderById(orderId, user);
  }

  // 🔁 Update Status (Admin / Webhook)
  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderResponseDto> {
    return this.updateStatusProvider.updateStatus(orderId, status);
  }

  async releaseExpiredReservations(): Promise<number> {
    return this.releaseExpiredReservationsProvider.releaseExpiredReservations();
  }

  async updateDeliveryTracking(
    orderId: string,
    dto: UpdateDeliveryTrackingDto,
  ): Promise<OrderResponseDto> {
    return this.updateDeliveryTrackingProvider.updateTracking(orderId, dto);
  }

  async getTracking(
    orderId: string,
    user: ActiveUserData,
  ): Promise<DeliveryTrackingResponseDto> {
    return this.getOrderTrackingProvider.getTracking(orderId, user);
  }
}
