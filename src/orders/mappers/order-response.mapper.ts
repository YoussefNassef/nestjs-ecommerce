/**
 * Map an Order entity to a plain DTO object that is safe for JSON serialization.
 * This avoids circular references while keeping a well-typed response shape.
 */

import {
  OrderItemResponseDto,
  OrderResponseDto,
} from '../dtos/order-response.dto';
import { Order } from '../entities/orders.entity';

export function toOrderResponseDto(order: Order): OrderResponseDto {
  const items: OrderItemResponseDto[] = (order.items ?? []).map((item) => ({
    id: item.id,
    product: item.product,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));

  const payment = order.payment
    ? {
        id: order.payment.id,
        moyasarPaymentId: order.payment.moyasarPaymentId,
        amount: order.payment.amount,
        status: order.payment.status,
        createdAt: order.payment.createdAt,
      }
    : null;

  return {
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    items,
    payment,
    createdAt: order.createdAt,
  };
}
