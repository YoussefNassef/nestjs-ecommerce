import { Injectable } from '@nestjs/common';
import { DashboardOverviewResponseDto } from '../dtos/dashboard-overview-response.dto';
import { DashboardQueryDto } from '../dtos/dashboard-query.dto';
import { AdminDashboardAnalyticsProvider } from './admin-dashboard-analytics.provider';
import { OrderStatus } from 'src/orders/enum/order.status.enum';

@Injectable()
export class GetDashboardOverviewProvider {
  constructor(
    private readonly analyticsProvider: AdminDashboardAnalyticsProvider,
  ) {}

  async getOverview(
    query: DashboardQueryDto,
  ): Promise<DashboardOverviewResponseDto> {
    const lowStockThreshold = this.analyticsProvider.getLowStockThreshold();
    const rangeDays = query.days ?? 7;
    const { now, todayStart, rangeStart } =
      this.analyticsProvider.getRangeDates(rangeDays);

    const [
      totalUsers,
      productCounts,
      orderCounts,
      grossRevenuePaidFlow,
      completedRevenue,
      todayRevenue,
      revenueInRange,
      orderStatusCounts,
      deliveryStatusCounts,
      salesByDay,
      paymentStatusCounts,
      inventorySummary,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      this.analyticsProvider.getTotalUsers(),
      this.analyticsProvider.getProductCounts(lowStockThreshold),
      this.analyticsProvider.getOrderCounts(rangeStart, now),
      this.analyticsProvider.getRevenueByStatuses(
        AdminDashboardAnalyticsProvider.paidFlowStatuses,
      ),
      this.analyticsProvider.getRevenueByStatuses([OrderStatus.COMPLETED]),
      this.analyticsProvider.getRevenueByStatuses(
        AdminDashboardAnalyticsProvider.paidFlowStatuses,
        todayStart,
        now,
      ),
      this.analyticsProvider.getRevenueByStatuses(
        AdminDashboardAnalyticsProvider.paidFlowStatuses,
        rangeStart,
        now,
      ),
      this.analyticsProvider.getOrderStatusCounts(),
      this.analyticsProvider.getDeliveryStatusCounts(),
      this.analyticsProvider.getSalesByDay(rangeStart, rangeDays),
      this.analyticsProvider.getPaymentStatusCounts(rangeStart, now),
      this.analyticsProvider.getInventorySummary(lowStockThreshold),
      this.analyticsProvider.getTopProducts(rangeStart, now),
      this.analyticsProvider.getRecentOrders(),
    ]);

    return {
      generatedAt: now.toISOString(),
      rangeDays,
      kpis: {
        totalUsers,
        totalProducts: productCounts.totalProducts,
        activeProducts: productCounts.activeProducts,
        lowStockProducts: productCounts.lowStockProducts,
        totalOrders: orderCounts.totalOrders,
        pendingPaymentOrders: orderCounts.pendingPaymentOrders,
        paidOrders: orderCounts.paidOrders,
        inProgressOrders: orderCounts.inProgressOrders,
        completedOrders: orderCounts.completedOrders,
        cancelledOrders: orderCounts.cancelledOrders,
        grossRevenuePaidFlow,
        completedRevenue,
        todayRevenue,
        averageOrderValue:
          orderCounts.paidOrdersInRange > 0
            ? Math.round(revenueInRange / orderCounts.paidOrdersInRange)
            : 0,
        paidOrdersInRange: orderCounts.paidOrdersInRange,
        ordersInRange: orderCounts.ordersInRange,
      },
      orderStatusCounts,
      deliveryStatusCounts,
      salesLast7Days: salesByDay,
      paymentStatusCounts,
      inventorySummary,
      topProducts,
      recentOrders,
    };
  }
}
