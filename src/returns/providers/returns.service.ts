import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { DeliveryStatus } from 'src/orders/enums/delivery-status.enum';
import { Order } from 'src/orders/entities/orders.entity';
import { OrderStatus } from 'src/orders/enum/order.status.enum';
import { Repository } from 'typeorm';
import { CreateReturnRequestDto } from '../dtos/create-return-request.dto';
import { ListReturnRequestsQueryDto } from '../dtos/list-return-requests-query.dto';
import { ReturnRequestResponseDto } from '../dtos/return-request-response.dto';
import { UpdateReturnRequestStatusDto } from '../dtos/update-return-request-status.dto';
import { ReturnRequestStatus } from '../enums/return-request-status.enum';
import { ReturnRequest } from '../return-request.entity';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnRequest)
    private readonly returnRequestRepo: Repository<ReturnRequest>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async createReturnRequest(
    user: ActiveUserData,
    dto: CreateReturnRequestDto,
  ): Promise<ReturnRequestResponseDto> {
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
      relations: ['user', 'payment'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (Number(order.user?.id) !== Number(user.sub)) {
      throw new ForbiddenException(
        'You are not allowed to create a return for this order',
      );
    }

    if (
      order.status !== OrderStatus.COMPLETED ||
      order.deliveryStatus !== DeliveryStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Return is allowed only for delivered completed orders',
      );
    }

    const existing = await this.returnRequestRepo.findOne({
      where: { order: { id: order.id } },
    });
    if (existing) {
      throw new BadRequestException(
        'A return request already exists for this order',
      );
    }

    const returnRequest = this.returnRequestRepo.create({
      order: { id: order.id },
      user: { id: Number(user.sub) },
      reason: dto.reason,
      reasonDetails: dto.reasonDetails?.trim() ?? null,
      status: ReturnRequestStatus.REQUESTED,
      refundAmount: order.payment?.amount ?? order.totalAmount,
      adminNote: null,
      handledByAdminUserId: null,
    });

    const saved = await this.returnRequestRepo.save(returnRequest);
    return this.toResponseDto(saved);
  }

  async getMyReturnRequests(
    user: ActiveUserData,
  ): Promise<ReturnRequestResponseDto[]> {
    const rows = await this.returnRequestRepo.find({
      where: { user: { id: Number(user.sub) } },
      relations: ['order', 'user'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toResponseDto(row));
  }

  async getAllReturnRequests(
    query: ListReturnRequestsQueryDto,
  ): Promise<ReturnRequestResponseDto[]> {
    const rows = await this.returnRequestRepo.find({
      where: query.status ? { status: query.status } : {},
      relations: ['order', 'user'],
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toResponseDto(row));
  }

  async updateReturnRequestStatus(
    id: string,
    dto: UpdateReturnRequestStatusDto,
    admin: ActiveUserData,
  ): Promise<ReturnRequestResponseDto> {
    const row = await this.returnRequestRepo.findOne({
      where: { id },
      relations: ['order', 'user'],
    });
    if (!row) {
      throw new NotFoundException('Return request not found');
    }

    this.ensureValidStatusTransition(row.status, dto.status);

    if (dto.refundAmount !== undefined) {
      row.refundAmount = dto.refundAmount;
    }
    if (dto.adminNote !== undefined) {
      row.adminNote = dto.adminNote.trim();
    }

    row.status = dto.status;
    row.handledByAdminUserId = Number(admin.sub);

    const now = new Date();
    switch (dto.status) {
      case ReturnRequestStatus.APPROVED:
        row.approvedAt = row.approvedAt ?? now;
        break;
      case ReturnRequestStatus.REJECTED:
        row.rejectedAt = row.rejectedAt ?? now;
        break;
      case ReturnRequestStatus.REFUND_INITIATED:
        row.refundInitiatedAt = row.refundInitiatedAt ?? now;
        break;
      case ReturnRequestStatus.REFUNDED:
        row.refundedAt = row.refundedAt ?? now;
        break;
      case ReturnRequestStatus.CANCELLED:
        row.cancelledAt = row.cancelledAt ?? now;
        break;
      default:
        break;
    }

    const saved = await this.returnRequestRepo.save(row);
    return this.toResponseDto(saved);
  }

  async cancelMyReturnRequest(
    id: string,
    user: ActiveUserData,
  ): Promise<ReturnRequestResponseDto> {
    const row = await this.returnRequestRepo.findOne({
      where: { id },
      relations: ['order', 'user'],
    });
    if (!row) {
      throw new NotFoundException('Return request not found');
    }

    if (Number(row.user?.id) !== Number(user.sub)) {
      throw new ForbiddenException(
        'You are not allowed to cancel this return request',
      );
    }

    if (row.status !== ReturnRequestStatus.REQUESTED) {
      throw new BadRequestException(
        'Only requested return can be cancelled by customer',
      );
    }

    row.status = ReturnRequestStatus.CANCELLED;
    row.cancelledAt = new Date();
    const saved = await this.returnRequestRepo.save(row);
    return this.toResponseDto(saved);
  }

  private ensureValidStatusTransition(
    currentStatus: ReturnRequestStatus,
    nextStatus: ReturnRequestStatus,
  ): void {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions: Record<
      ReturnRequestStatus,
      ReturnRequestStatus[]
    > = {
      [ReturnRequestStatus.REQUESTED]: [
        ReturnRequestStatus.APPROVED,
        ReturnRequestStatus.REJECTED,
        ReturnRequestStatus.CANCELLED,
      ],
      [ReturnRequestStatus.APPROVED]: [ReturnRequestStatus.REFUND_INITIATED],
      [ReturnRequestStatus.REFUND_INITIATED]: [ReturnRequestStatus.REFUNDED],
      [ReturnRequestStatus.REJECTED]: [],
      [ReturnRequestStatus.REFUNDED]: [],
      [ReturnRequestStatus.CANCELLED]: [],
    };

    const allowed = allowedTransitions[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid return status transition from ${currentStatus} to ${nextStatus}`,
      );
    }
  }

  private toResponseDto(row: ReturnRequest): ReturnRequestResponseDto {
    return {
      id: row.id,
      orderId: row.order?.id ?? '',
      userId: Number(row.user?.id ?? 0),
      reason: row.reason,
      reasonDetails: row.reasonDetails ?? null,
      status: row.status,
      refundAmount: row.refundAmount,
      adminNote: row.adminNote ?? null,
      handledByAdminUserId: row.handledByAdminUserId ?? null,
      approvedAt: row.approvedAt ?? null,
      rejectedAt: row.rejectedAt ?? null,
      refundInitiatedAt: row.refundInitiatedAt ?? null,
      refundedAt: row.refundedAt ?? null,
      cancelledAt: row.cancelledAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
