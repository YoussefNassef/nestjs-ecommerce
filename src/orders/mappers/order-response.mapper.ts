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
    stockReserved: order.stockReserved ?? false,
    reservationExpiresAt: order.reservationExpiresAt ?? null,
    totalAmount: order.totalAmount,
    subtotalAmount:
      order.subtotalAmount ??
      items.reduce((sum, item) => sum + item.subtotal, 0),
    discountAmount: order.discountAmount ?? 0,
    couponCode: order.couponCode ?? null,
    shippingMethod: order.shippingMethod,
    shippingCost: order.shippingCost ?? 0,
    shippingEtaDays: order.shippingEtaDays ?? 0,
    deliveryStatus: order.deliveryStatus,
    trackingNumber: order.trackingNumber ?? null,
    shippingCarrier: order.shippingCarrier ?? null,
    trackingUrl: order.trackingUrl ?? null,
    currentLocation: order.currentLocation ?? null,
    trackingNote: order.trackingNote ?? null,
    estimatedDeliveryAt: order.estimatedDeliveryAt ?? null,
    shippedAt: order.shippedAt ?? null,
    outForDeliveryAt: order.outForDeliveryAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    deliveryStatusUpdatedAt: order.deliveryStatusUpdatedAt ?? null,
    shippingAddressSnapshot: order.shippingAddressSnapshot ?? null,
    items,
    payment,
    createdAt: order.createdAt,
  };
}
