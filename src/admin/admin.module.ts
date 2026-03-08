import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/orders.entity';
import { OrderItem } from 'src/orders/entities/orders-item.entity';
import { Payment } from 'src/payments/payments.entity';
import { Product } from 'src/products/products.entity';
import { User } from 'src/users/user.entity';
import { AdminController } from './admin.controller';
import { AdminDashboardAnalyticsProvider } from './providers/admin-dashboard-analytics.provider';
import { AdminService } from './providers/admin.service';
import { GetDashboardOverviewProvider } from './providers/get-dashboard-overview.provider';

@Module({
  imports: [TypeOrmModule.forFeature([User, Product, Order, OrderItem, Payment])],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminDashboardAnalyticsProvider,
    GetDashboardOverviewProvider,
  ],
})
export class AdminModule {}
