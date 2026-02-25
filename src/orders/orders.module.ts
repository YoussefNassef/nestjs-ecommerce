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

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, CreateOrderProvider, GetUserOrdersProvider, GetOrderEntityByIdProvider, GetOrderByIdProvider, UpdateStatusProvider],
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), CartModule],
  exports: [OrdersService],
})
export class OrdersModule {}
