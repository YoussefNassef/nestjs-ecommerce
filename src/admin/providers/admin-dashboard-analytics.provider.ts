import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Order } from 'src/orders/entities/orders.entity';
import { OrderItem } from 'src/orders/entities/orders-item.entity';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { DeliveryStatus } from 'src/orders/enums/delivery-status.enum';
import { Payment } from 'src/payments/payments.entity';
import { PaymentStatus } from 'src/payments/enums/PaymentStatus.enum';
import { Product } from 'src/products/products.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class AdminDashboardAnalyticsProvider {
  static readonly paidFlowStatuses: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.IN_PROGRESS,
    OrderStatus.COMPLETED,
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  getLowStockThreshold(): number {
    return Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
  }

  getRangeDates(rangeDays: number): {
    now: Date;
    todayStart: Date;
    rangeStart: Date;
  } {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const rangeStart = new Date(todayStart);
    rangeStart.setDate(rangeStart.getDate() - (rangeDays - 1));

    return { now, todayStart, rangeStart };
  }

  async getTotalUsers(): Promise<number> {
    return this.userRepo.count();
  }

  async getProductCounts(lowStockThreshold: number) {
    const [totalProducts, activeProducts, lowStockProducts] = await Promise.all(
      [
        this.productRepo.count(),
        this.productRepo.count({ where: { isActive: true } }),
        this.productRepo
          .createQueryBuilder('product')
          .where('product.stock <= :threshold', {
            threshold: lowStockThreshold,
          })
          .getCount(),
      ],
    );

    return { totalProducts, activeProducts, lowStockProducts };
  }

  async getOrderCounts(rangeStart: Date, now: Date) {
    const [
      totalOrders,
      pendingPaymentOrders,
      paidOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      ordersInRange,
      paidOrdersInRange,
    ] = await Promise.all([
      this.orderRepo.count(),
      this.orderRepo.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
      this.orderRepo.count({ where: { status: OrderStatus.PAID } }),
      this.orderRepo.count({ where: { status: OrderStatus.IN_PROGRESS } }),
      this.orderRepo.count({ where: { status: OrderStatus.COMPLETED } }),
      this.orderRepo.count({ where: { status: OrderStatus.CANCELLED } }),
      this.orderRepo.count({ where: { createdAt: Between(rangeStart, now) } }),
      this.orderRepo.count({
        where: {
          createdAt: Between(rangeStart, now),
          status: In(AdminDashboardAnalyticsProvider.paidFlowStatuses),
        },
      }),
    ]);

    return {
      totalOrders,
      pendingPaymentOrders,
      paidOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      ordersInRange,
      paidOrdersInRange,
    };
  }

  async getRevenueByStatuses(
    statuses: OrderStatus[],
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .select(
        'COALESCE(SUM(GREATEST(order.subtotalAmount - order.discountAmount, 0) + order.shippingCost), 0)',
        'revenue',
      )
      .where('order.status IN (:...statuses)', { statuses });

    if (startDate && endDate) {
      qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const raw = await qb.getRawOne<{ revenue: string | number }>();
    return Number(raw?.revenue ?? 0);
  }

  async getOrderStatusCounts() {
    const rows = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany<{ status: OrderStatus; count: string }>();

    return Object.values(OrderStatus).map((status) => {
      const row = rows.find((item) => item.status === status);
      return { status, count: Number(row?.count ?? 0) };
    });
  }

  async getDeliveryStatusCounts() {
    const rows = await this.orderRepo
      .createQueryBuilder('order')
      .select('order.deliveryStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.deliveryStatus')
      .getRawMany<{ status: DeliveryStatus; count: string }>();

    return Object.values(DeliveryStatus).map((status) => {
      const row = rows.find((item) => item.status === status);
      return { status, count: Number(row?.count ?? 0) };
    });
  }

  async getSalesByDay(startDate: Date, rangeDays: number) {
    const rows = await this.orderRepo
      .createQueryBuilder('order')
      .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'day')
      .addSelect('COUNT(*)', 'totalOrders')
      .addSelect(
        'SUM(CASE WHEN order.status IN (:...paidStatuses) THEN 1 ELSE 0 END)',
        'paidFlowOrders',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN order.status IN (:...paidStatuses) THEN (GREATEST(order.subtotalAmount - order.discountAmount, 0) + order.shippingCost) ELSE 0 END), 0)',
        'revenue',
      )
      .where('order.createdAt >= :startDate', { startDate })
      .setParameter(
        'paidStatuses',
        AdminDashboardAnalyticsProvider.paidFlowStatuses,
      )
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{
        day: string;
        totalOrders: string;
        paidFlowOrders: string;
        revenue: string;
      }>();

    const rowByDay = new Map(rows.map((row) => [row.day, row]));
    return Array.from({ length: rangeDays }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const dayKey = date.toISOString().slice(0, 10);
      const row = rowByDay.get(dayKey);

      return {
        date: dayKey,
        totalOrders: Number(row?.totalOrders ?? 0),
        paidFlowOrders: Number(row?.paidFlowOrders ?? 0),
        revenue: Number(row?.revenue ?? 0),
      };
    });
  }

  async getPaymentStatusCounts(startDate: Date, endDate: Date) {
    const rows = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .where('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('payment.status')
      .getRawMany<{ status: PaymentStatus; count: string; amount: string }>();

    return Object.values(PaymentStatus).map((status) => {
      const row = rows.find((item) => item.status === status);
      return {
        status,
        count: Number(row?.count ?? 0),
        amount: Number(row?.amount ?? 0),
      };
    });
  }

  async getInventorySummary(lowStockThreshold: number) {
    const raw = await this.productRepo
      .createQueryBuilder('product')
      .select('COUNT(*)', 'totalProducts')
      .addSelect(
        'SUM(CASE WHEN product.stock <= 0 THEN 1 ELSE 0 END)',
        'outOfStockProducts',
      )
      .addSelect(
        'SUM(CASE WHEN product.stock > 0 AND product.stock <= :threshold THEN 1 ELSE 0 END)',
        'lowStockProducts',
      )
      .addSelect(
        'COALESCE(SUM(product.reservedStock), 0)',
        'totalReservedUnits',
      )
      .addSelect('COALESCE(SUM(product.stock), 0)', 'totalAvailableUnits')
      .setParameter('threshold', lowStockThreshold)
      .getRawOne<{
        totalProducts: string;
        outOfStockProducts: string;
        lowStockProducts: string;
        totalReservedUnits: string;
        totalAvailableUnits: string;
      }>();

    return {
      totalProducts: Number(raw?.totalProducts ?? 0),
      outOfStockProducts: Number(raw?.outOfStockProducts ?? 0),
      lowStockProducts: Number(raw?.lowStockProducts ?? 0),
      totalReservedUnits: Number(raw?.totalReservedUnits ?? 0),
      totalAvailableUnits: Number(raw?.totalAvailableUnits ?? 0),
    };
  }

  async getTopProducts(startDate: Date, endDate: Date) {
    const rows = await this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('item.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'name')
      .addSelect('product.sku', 'sku')
      .addSelect('product.stock', 'stock')
      .addSelect('product.reservedStock', 'reservedStock')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantitySold')
      .addSelect('COALESCE(SUM(item.quantity * item.price), 0)', 'revenue')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status IN (:...statuses)', {
        statuses: AdminDashboardAnalyticsProvider.paidFlowStatuses,
      })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.sku')
      .addGroupBy('product.stock')
      .addGroupBy('product.reservedStock')
      .orderBy('SUM(item.quantity)', 'DESC')
      .addOrderBy('SUM(item.quantity * item.price)', 'DESC')
      .limit(5)
      .getRawMany<{
        productId: string;
        name: string;
        sku: string;
        stock: string;
        reservedStock: string;
        quantitySold: string;
        revenue: string;
      }>();

    return rows.map((row) => ({
      productId: row.productId,
      name: row.name,
      sku: row.sku,
      quantitySold: Number(row.quantitySold ?? 0),
      revenue: Number(row.revenue ?? 0),
      stock: Number(row.stock ?? 0),
      reservedStock: Number(row.reservedStock ?? 0),
    }));
  }

  async getRecentOrders() {
    const orders = await this.orderRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 10,
      where: {
        status: In([
          OrderStatus.PENDING_PAYMENT,
          OrderStatus.PAYMENT_INITIATED,
          OrderStatus.PAID,
          OrderStatus.IN_PROGRESS,
          OrderStatus.COMPLETED,
          OrderStatus.CANCELLED,
        ]),
        createdAt: Between(new Date(0), new Date()),
      },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      totalAmount:
        Math.max(0, (order.subtotalAmount ?? 0) - (order.discountAmount ?? 0)) +
        (order.shippingCost ?? 0),
      userId: order.user?.id ?? 0,
      userName: order.user?.fullName ?? 'Unknown',
      createdAt: order.createdAt,
    }));
  }
}
