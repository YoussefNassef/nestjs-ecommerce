import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './providers/orders.service';
import { Order } from './entities/orders.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './entities/orders-item.entity';
import { CartModule } from 'src/cart/cart.module';
import { CreateOrderProvider } from './providers/create-order.provider';
import { GetUserOrdersProvider } from './providers/get-user-orders.provider';
import { GetOrderEntityByIdProvider } from './providers/get-order-entity-by-id.provider';
import { GetOrderByIdProvider } from './providers/get-order-by-id.provider';
import { UpdateStatusProvider } from './providers/update-status.provider';
import { AddressesModule } from 'src/addresses/addresses.module';
import { QuoteOrderProvider } from './providers/quote-order.provider';
import { ShippingQuoteProvider } from './providers/shipping-quote.provider';
import { UpdateDeliveryTrackingProvider } from './providers/update-delivery-tracking.provider';
import { GetOrderTrackingProvider } from './providers/get-order-tracking.provider';
import { ReleaseExpiredReservationsProvider } from './providers/release-expired-reservations.provider';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CancelMyOrderProvider } from './providers/cancel-my-order.provider';
import { OrderTrackingEvent } from './entities/order-tracking-event.entity';
import { AdminOrderOpsController } from './admin-order-ops.controller';
import { OrderAdminAudit } from './entities/order-admin-audit.entity';
import { AdminOrderOpsProvider } from './providers/admin-order-ops.provider';

@Module({
  controllers: [OrdersController, AdminOrderOpsController],
  providers: [
    OrdersService,
    CreateOrderProvider,
    GetUserOrdersProvider,
    GetOrderEntityByIdProvider,
    GetOrderByIdProvider,
    UpdateStatusProvider,
    QuoteOrderProvider,
    ShippingQuoteProvider,
    UpdateDeliveryTrackingProvider,
    GetOrderTrackingProvider,
    ReleaseExpiredReservationsProvider,
    CancelMyOrderProvider,
    AdminOrderOpsProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderTrackingEvent,
      OrderAdminAudit,
    ]),
    CartModule,
    AddressesModule,
    NotificationsModule,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
