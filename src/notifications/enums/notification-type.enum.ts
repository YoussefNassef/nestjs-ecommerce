export enum NotificationType {
  ORDER_CREATED = 'order_created',
  PAYMENT_INITIATED = 'payment_initiated',
  ORDER_PAID = 'order_paid',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_IN_PROGRESS = 'order_in_progress',
  ORDER_COMPLETED = 'order_completed',
  DELIVERY_UPDATED = 'delivery_updated',
  LOW_STOCK_ALERT = 'low_stock_alert',
  INVENTORY_ANOMALY = 'inventory_anomaly',
  SUPPORT_TICKET_CREATED = 'support_ticket_created',
  SUPPORT_MESSAGE_RECEIVED = 'support_message_received',
  SUPPORT_TICKET_STATUS_CHANGED = 'support_ticket_status_changed',
}
