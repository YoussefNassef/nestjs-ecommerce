export enum OrderAdminAuditAction {
  NOTE_ADDED = 'note_added',
  ORDER_STATUS_UPDATED = 'order_status_updated',
  DELIVERY_TRACKING_UPDATED = 'delivery_tracking_updated',
  ORDER_CANCELLED = 'order_cancelled',
  BULK_ACTION_EXECUTED = 'bulk_action_executed',
}

export enum AdminOrderActionType {
  UPDATE_ORDER_STATUS = 'update_order_status',
  UPDATE_DELIVERY_TRACKING = 'update_delivery_tracking',
  CANCEL_ORDER = 'cancel_order',
}

