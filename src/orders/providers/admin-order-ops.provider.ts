import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderAdminAudit } from '../entities/order-admin-audit.entity';
import { Repository } from 'typeorm';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { CreateOrderAdminNoteDto } from '../dtos/create-order-admin-note.dto';
import { GetOrderEntityByIdProvider } from './get-order-entity-by-id.provider';
import { AdminOrderActionDto } from '../dtos/admin-order-action.dto';
import {
  AdminOrderActionType,
  OrderAdminAuditAction,
} from '../enums/order-admin-audit-action.enum';
import { UpdateStatusProvider } from './update-status.provider';
import { UpdateDeliveryTrackingProvider } from './update-delivery-tracking.provider';
import { BulkAdminOrderActionDto } from '../dtos/bulk-admin-order-action.dto';
import { OrderAdminAuditQueryDto } from '../dtos/order-admin-audit-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { OrderStatus } from '../enum/order.status.enum';

@Injectable()
export class AdminOrderOpsProvider {
  constructor(
    @InjectRepository(OrderAdminAudit)
    private readonly orderAdminAuditRepo: Repository<OrderAdminAudit>,
    private readonly getOrderEntityByIdProvider: GetOrderEntityByIdProvider,
    private readonly updateStatusProvider: UpdateStatusProvider,
    private readonly updateDeliveryTrackingProvider: UpdateDeliveryTrackingProvider,
  ) {}

  async addAdminNote(
    orderId: string,
    dto: CreateOrderAdminNoteDto,
    admin: ActiveUserData,
  ): Promise<OrderAdminAudit> {
    await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);

    const note = this.orderAdminAuditRepo.create({
      orderId,
      action: OrderAdminAuditAction.NOTE_ADDED,
      adminUserId: Number(admin.sub),
      note: dto.note.trim(),
      metadata: null,
    });
    return this.orderAdminAuditRepo.save(note);
  }

  async performAction(
    orderId: string,
    dto: AdminOrderActionDto,
    admin: ActiveUserData,
  ) {
    const before = await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);
    let orderResponse: unknown;
    let auditAction: OrderAdminAuditAction;

    switch (dto.action) {
      case AdminOrderActionType.UPDATE_ORDER_STATUS: {
        if (!dto.orderStatus) {
          throw new BadRequestException(
            'orderStatus is required for update_order_status action',
          );
        }
        orderResponse = await this.updateStatusProvider.updateStatus(
          orderId,
          dto.orderStatus,
        );
        auditAction = OrderAdminAuditAction.ORDER_STATUS_UPDATED;
        break;
      }

      case AdminOrderActionType.UPDATE_DELIVERY_TRACKING: {
        if (!dto.deliveryStatus) {
          throw new BadRequestException(
            'deliveryStatus is required for update_delivery_tracking action',
          );
        }
        orderResponse = await this.updateDeliveryTrackingProvider.updateTracking(
          orderId,
          {
            deliveryStatus: dto.deliveryStatus,
            trackingNumber: dto.trackingNumber,
            shippingCarrier: dto.shippingCarrier,
            trackingUrl: dto.trackingUrl,
            currentLocation: dto.currentLocation,
            trackingNote: dto.trackingNote,
            estimatedDeliveryAt: dto.estimatedDeliveryAt,
          },
          admin,
        );
        auditAction = OrderAdminAuditAction.DELIVERY_TRACKING_UPDATED;
        break;
      }

      case AdminOrderActionType.CANCEL_ORDER: {
        orderResponse = await this.updateStatusProvider.updateStatus(
          orderId,
          OrderStatus.CANCELLED,
        );
        auditAction = OrderAdminAuditAction.ORDER_CANCELLED;
        break;
      }

      default:
        throw new BadRequestException('Unsupported admin action');
    }

    const after = await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);
    await this.orderAdminAuditRepo.save(
      this.orderAdminAuditRepo.create({
        orderId,
        action: auditAction,
        adminUserId: Number(admin.sub),
        note: dto.note?.trim() || null,
        metadata: {
          action: dto.action,
          fromOrderStatus: before.status,
          toOrderStatus: after.status,
          fromDeliveryStatus: before.deliveryStatus,
          toDeliveryStatus: after.deliveryStatus,
          payload: {
            orderStatus: dto.orderStatus ?? null,
            deliveryStatus: dto.deliveryStatus ?? null,
            trackingNumber: dto.trackingNumber ?? null,
            shippingCarrier: dto.shippingCarrier ?? null,
            trackingUrl: dto.trackingUrl ?? null,
            currentLocation: dto.currentLocation ?? null,
            trackingNote: dto.trackingNote ?? null,
            estimatedDeliveryAt: dto.estimatedDeliveryAt ?? null,
          },
        },
      }),
    );

    return orderResponse;
  }

  async listAudit(
    orderId: string,
    query: OrderAdminAuditQueryDto,
  ): Promise<PaginatedResponse<OrderAdminAudit>> {
    await this.getOrderEntityByIdProvider.getOrderEntityById(orderId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, totalItems] = await this.orderAdminAuditRepo.findAndCount({
      where: { orderId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async performBulkAction(
    dto: BulkAdminOrderActionDto,
    admin: ActiveUserData,
  ): Promise<{
    total: number;
    successCount: number;
    failureCount: number;
    successes: string[];
    failures: Array<{ orderId: string; message: string }>;
  }> {
    const uniqueOrderIds = [...new Set(dto.orderIds)];
    const successes: string[] = [];
    const failures: Array<{ orderId: string; message: string }> = [];

    for (const orderId of uniqueOrderIds) {
      try {
        await this.performAction(orderId, dto.action, admin);
        successes.push(orderId);
      } catch (error) {
        failures.push({
          orderId,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      total: uniqueOrderIds.length,
      successCount: successes.length,
      failureCount: failures.length,
      successes,
      failures,
    };
  }
}
