import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from 'src/orders/enums/delivery-status.enum';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { PaymentStatus } from 'src/payments/enums/PaymentStatus.enum';

export class DashboardKpisDto {
  @ApiProperty({ example: 120 })
  totalUsers: number;

  @ApiProperty({ example: 85 })
  totalProducts: number;

  @ApiProperty({ example: 74 })
  activeProducts: number;

  @ApiProperty({ example: 6 })
  lowStockProducts: number;

  @ApiProperty({ example: 430 })
  totalOrders: number;

  @ApiProperty({ example: 52 })
  pendingPaymentOrders: number;

  @ApiProperty({ example: 138 })
  paidOrders: number;

  @ApiProperty({ example: 121 })
  inProgressOrders: number;

  @ApiProperty({ example: 103 })
  completedOrders: number;

  @ApiProperty({ example: 16 })
  cancelledOrders: number;

  @ApiProperty({ example: 238940 })
  grossRevenuePaidFlow: number;

  @ApiProperty({ example: 166500 })
  completedRevenue: number;

  @ApiProperty({ example: 12800 })
  todayRevenue: number;

  @ApiProperty({ example: 1720 })
  averageOrderValue: number;

  @ApiProperty({ example: 37 })
  paidOrdersInRange: number;

  @ApiProperty({ example: 52 })
  ordersInRange: number;
}

export class DashboardOrderStatusCountDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.COMPLETED })
  status: OrderStatus;

  @ApiProperty({ example: 103 })
  count: number;
}

export class DashboardDeliveryStatusCountDto {
  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.OUT_FOR_DELIVERY })
  status: DeliveryStatus;

  @ApiProperty({ example: 27 })
  count: number;
}

export class DashboardSalesPointDto {
  @ApiProperty({ example: '2026-03-01' })
  date: string;

  @ApiProperty({ example: 15 })
  totalOrders: number;

  @ApiProperty({ example: 9 })
  paidFlowOrders: number;

  @ApiProperty({ example: 9700 })
  revenue: number;
}

export class DashboardPaymentStatusCountDto {
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID })
  status: PaymentStatus;

  @ApiProperty({ example: 42 })
  count: number;

  @ApiProperty({ example: 51000 })
  amount: number;
}

export class DashboardInventorySummaryDto {
  @ApiProperty({ example: 85 })
  totalProducts: number;

  @ApiProperty({ example: 9 })
  outOfStockProducts: number;

  @ApiProperty({ example: 14 })
  lowStockProducts: number;

  @ApiProperty({ example: 53 })
  totalReservedUnits: number;

  @ApiProperty({ example: 612 })
  totalAvailableUnits: number;
}

export class DashboardTopProductDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  productId: string;

  @ApiProperty({ example: 'iPhone 15 Pro' })
  name: string;

  @ApiProperty({ example: 'IPH15PRO-256-BLK' })
  sku: string;

  @ApiProperty({ example: 17 })
  quantitySold: number;

  @ApiProperty({ example: 84983 })
  revenue: number;

  @ApiProperty({ example: 8 })
  stock: number;

  @ApiProperty({ example: 3 })
  reservedStock: number;
}

export class DashboardRecentOrderDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.IN_PROGRESS })
  status: OrderStatus;

  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.SHIPPED })
  deliveryStatus: DeliveryStatus;

  @ApiProperty({ example: 1299 })
  totalAmount: number;

  @ApiProperty({ example: 42 })
  userId: number;

  @ApiProperty({ example: 'Ahmed Ali' })
  userName: string;

  @ApiProperty({ example: '2026-03-05T12:30:00.000Z' })
  createdAt: Date;
}

export class DashboardOverviewResponseDto {
  @ApiProperty({ example: '2026-03-05T12:30:00.000Z' })
  generatedAt: string;

  @ApiProperty({ example: 7 })
  rangeDays: number;

  @ApiProperty({ type: () => DashboardKpisDto })
  kpis: DashboardKpisDto;

  @ApiProperty({ type: () => [DashboardOrderStatusCountDto] })
  orderStatusCounts: DashboardOrderStatusCountDto[];

  @ApiProperty({ type: () => [DashboardDeliveryStatusCountDto] })
  deliveryStatusCounts: DashboardDeliveryStatusCountDto[];

  @ApiProperty({ type: () => [DashboardSalesPointDto] })
  salesLast7Days: DashboardSalesPointDto[];

  @ApiProperty({ type: () => [DashboardPaymentStatusCountDto] })
  paymentStatusCounts: DashboardPaymentStatusCountDto[];

  @ApiProperty({ type: () => DashboardInventorySummaryDto })
  inventorySummary: DashboardInventorySummaryDto;

  @ApiProperty({ type: () => [DashboardTopProductDto] })
  topProducts: DashboardTopProductDto[];

  @ApiProperty({ type: () => [DashboardRecentOrderDto] })
  recentOrders: DashboardRecentOrderDto[];
}
