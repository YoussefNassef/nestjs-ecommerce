import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/auth/enums/role.enum';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';
import { NotificationsService } from 'src/notifications/providers/notifications.service';
import { Order } from 'src/orders/entities/orders.entity';
import { Repository } from 'typeorm';
import { CreateSupportMessageDto } from '../dtos/create-support-message.dto';
import { CreateSupportTicketDto } from '../dtos/create-support-ticket.dto';
import { SupportMessageResponseDto } from '../dtos/support-message-response.dto';
import {
  SupportTicketDetailsResponseDto,
  SupportTicketResponseDto,
} from '../dtos/support-ticket-response.dto';
import { SupportTicketListQueryDto } from '../dtos/support-ticket-list-query.dto';
import { SupportUnreadCountResponseDto } from '../dtos/support-unread-count-response.dto';
import { UpdateSupportTicketStatusDto } from '../dtos/update-support-ticket-status.dto';
import { SupportMessage } from '../entities/support-message.entity';
import { SupportMessageRead } from '../entities/support-message-read.entity';
import { SupportTicket } from '../entities/support-ticket.entity';
import { SupportTicketCategory } from '../enums/support-ticket-category.enum';
import { SupportTicketPriority } from '../enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '../enums/support-ticket-status.enum';
import { SupportEventsService } from './support-events.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepo: Repository<SupportTicket>,
    @InjectRepository(SupportMessage)
    private readonly supportMessageRepo: Repository<SupportMessage>,
    @InjectRepository(SupportMessageRead)
    private readonly supportMessageReadRepo: Repository<SupportMessageRead>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly notificationsService: NotificationsService,
    private readonly supportEventsService: SupportEventsService,
  ) {}

  async createTicket(
    user: ActiveUserData,
    dto: CreateSupportTicketDto,
  ): Promise<SupportTicketDetailsResponseDto> {
    await this.assertOrderOwnership(dto.orderId, Number(user.sub));

    const now = new Date();
    const ticket = this.supportTicketRepo.create({
      userId: Number(user.sub),
      orderId: dto.orderId ?? null,
      subject: dto.subject.trim(),
      status: SupportTicketStatus.OPEN,
      priority: dto.priority ?? SupportTicketPriority.NORMAL,
      category: dto.category ?? SupportTicketCategory.OTHER,
      assignedAdminUserId: null,
      lastMessageAt: now,
      customerLastReadAt: now,
      adminLastReadAt: null,
      closedAt: null,
    });
    const savedTicket = await this.supportTicketRepo.save(ticket);

    const firstMessage = this.supportMessageRepo.create({
      ticketId: savedTicket.id,
      authorUserId: Number(user.sub),
      authorRole: Role.USER,
      message: dto.message.trim(),
      isInternal: false,
    });
    await this.supportMessageRepo.save(firstMessage);

    await this.notificationsService.createForAdmins({
      type: NotificationType.SUPPORT_TICKET_CREATED,
      title: 'New support ticket',
      body: `Ticket "${savedTicket.subject}" created by user #${savedTicket.userId}.`,
      data: {
        ticketId: savedTicket.id,
        userId: savedTicket.userId,
        orderId: savedTicket.orderId,
      },
    });
    this.supportEventsService.emit({
      event: 'ticket_created',
      ticketId: savedTicket.id,
      userId: savedTicket.userId,
      actorUserId: Number(user.sub),
      createdAt: new Date().toISOString(),
    });

    return this.getMyTicketById(savedTicket.id, user);
  }

  async listMyTickets(
    user: ActiveUserData,
    query: SupportTicketListQueryDto,
  ): Promise<PaginatedResponse<SupportTicketResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.supportTicketRepo
      .createQueryBuilder('ticket')
      .where('ticket.userId = :userId', { userId: Number(user.sub) });

    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }
    if (query.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: query.priority });
    }
    if (query.orderId) {
      qb.andWhere('ticket.orderId = :orderId', { orderId: query.orderId });
    }

    const [tickets, totalItems] = await qb
      .orderBy('ticket.lastMessageAt', 'DESC')
      .addOrderBy('ticket.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const ticketSummary = await this.buildTicketSummary(
      tickets,
      Role.USER,
      Number(user.sub),
    );
    return {
      items: tickets.map((item) =>
        this.toTicketResponse(
          item,
          ticketSummary.previewByTicketId[item.id] ?? null,
          ticketSummary.unreadByTicketId[item.id] ?? 0,
        ),
      ),
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

  async getMyTicketById(
    ticketId: string,
    user: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    const ticket = await this.supportTicketRepo.findOne({
      where: { id: ticketId, userId: Number(user.sub) },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    await this.markTicketReadByUser(ticket.id, Number(user.sub));

    return this.toTicketDetailsResponse(ticket, false);
  }

  async addMessageAsUser(
    ticketId: string,
    user: ActiveUserData,
    dto: CreateSupportMessageDto,
  ): Promise<SupportMessageResponseDto> {
    const ticket = await this.supportTicketRepo.findOne({
      where: { id: ticketId, userId: Number(user.sub) },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Cannot reply to a closed support ticket');
    }

    const message = this.supportMessageRepo.create({
      ticketId: ticket.id,
      authorUserId: Number(user.sub),
      authorRole: Role.USER,
      message: dto.message.trim(),
      isInternal: false,
    });
    const saved = await this.supportMessageRepo.save(message);

    const nextStatus =
      ticket.status === SupportTicketStatus.WAITING_CUSTOMER ||
      ticket.status === SupportTicketStatus.RESOLVED
        ? SupportTicketStatus.OPEN
        : ticket.status;

    await this.supportTicketRepo.update(ticket.id, {
      status: nextStatus,
      lastMessageAt: saved.createdAt,
      customerLastReadAt: saved.createdAt,
      closedAt: null,
    });

    await this.notificationsService.createForAdmins({
      type: NotificationType.SUPPORT_MESSAGE_RECEIVED,
      title: 'Customer replied on support ticket',
      body: `Ticket "${ticket.subject}" has a new customer reply.`,
      data: { ticketId: ticket.id, userId: ticket.userId },
    });
    this.supportEventsService.emit({
      event: 'message_created',
      ticketId: ticket.id,
      userId: ticket.userId,
      actorUserId: Number(user.sub),
      isInternalMessage: false,
      createdAt: saved.createdAt.toISOString(),
    });

    return this.toMessageResponse(saved);
  }

  async closeMyTicket(
    ticketId: string,
    user: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    const ticket = await this.supportTicketRepo.findOne({
      where: { id: ticketId, userId: Number(user.sub) },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Support ticket is already closed');
    }

    await this.supportTicketRepo.update(ticket.id, {
      status: SupportTicketStatus.CLOSED,
      closedAt: new Date(),
    });
    await this.notificationsService.createForAdmins({
      type: NotificationType.SUPPORT_TICKET_STATUS_CHANGED,
      title: 'Support ticket closed by customer',
      body: `Ticket "${ticket.subject}" was closed by customer.`,
      data: { ticketId: ticket.id, status: SupportTicketStatus.CLOSED },
    });
    this.supportEventsService.emit({
      event: 'ticket_status_changed',
      ticketId: ticket.id,
      userId: ticket.userId,
      actorUserId: Number(user.sub),
      status: SupportTicketStatus.CLOSED,
      createdAt: new Date().toISOString(),
    });
    return this.getMyTicketById(ticket.id, user);
  }

  async reopenMyTicket(
    ticketId: string,
    user: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    const ticket = await this.supportTicketRepo.findOne({
      where: { id: ticketId, userId: Number(user.sub) },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    if (
      ticket.status !== SupportTicketStatus.CLOSED &&
      ticket.status !== SupportTicketStatus.RESOLVED
    ) {
      throw new BadRequestException(
        'Only resolved or closed support tickets can be reopened',
      );
    }

    await this.supportTicketRepo.update(ticket.id, {
      status: SupportTicketStatus.OPEN,
      closedAt: null,
      lastMessageAt: new Date(),
      customerLastReadAt: new Date(),
    });
    await this.notificationsService.createForAdmins({
      type: NotificationType.SUPPORT_TICKET_STATUS_CHANGED,
      title: 'Support ticket reopened by customer',
      body: `Ticket "${ticket.subject}" was reopened by customer.`,
      data: { ticketId: ticket.id, status: SupportTicketStatus.OPEN },
    });
    this.supportEventsService.emit({
      event: 'ticket_status_changed',
      ticketId: ticket.id,
      userId: ticket.userId,
      actorUserId: Number(user.sub),
      status: SupportTicketStatus.OPEN,
      createdAt: new Date().toISOString(),
    });
    return this.getMyTicketById(ticket.id, user);
  }

  async getMyUnreadCount(
    user: ActiveUserData,
  ): Promise<SupportUnreadCountResponseDto> {
    const unreadCount = await this.getUnreadCountForUser(Number(user.sub));
    return { unreadCount };
  }

  async listTicketsForAdmin(
    query: SupportTicketListQueryDto,
    admin: ActiveUserData,
  ): Promise<PaginatedResponse<SupportTicketResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.supportTicketRepo.createQueryBuilder('ticket');
    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }
    if (query.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: query.priority });
    }
    if (query.orderId) {
      qb.andWhere('ticket.orderId = :orderId', { orderId: query.orderId });
    }
    if (query.userId) {
      qb.andWhere('ticket.userId = :userId', { userId: query.userId });
    }
    if (query.assignedToMe) {
      qb.andWhere('ticket.assignedAdminUserId = :adminId', {
        adminId: Number(admin.sub),
      });
    }

    const [tickets, totalItems] = await qb
      .orderBy('ticket.lastMessageAt', 'DESC')
      .addOrderBy('ticket.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const ticketSummary = await this.buildTicketSummary(
      tickets,
      Role.ADMIN,
      Number(admin.sub),
    );
    return {
      items: tickets.map((item) =>
        this.toTicketResponse(
          item,
          ticketSummary.previewByTicketId[item.id] ?? null,
          ticketSummary.unreadByTicketId[item.id] ?? 0,
        ),
      ),
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

  async getTicketByIdForAdmin(
    ticketId: string,
    admin: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    const ticket = await this.supportTicketRepo.findOne({
      where: { id: ticketId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    await this.markTicketReadByAdmin(ticket.id, Number(admin.sub));
    return this.toTicketDetailsResponse(ticket, true);
  }

  async assignToMe(
    ticketId: string,
    admin: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    const ticket = await this.requireTicket(ticketId);

    const nextStatus =
      ticket.status === SupportTicketStatus.OPEN
        ? SupportTicketStatus.IN_PROGRESS
        : ticket.status;

    await this.supportTicketRepo.update(ticket.id, {
      assignedAdminUserId: Number(admin.sub),
      status: nextStatus,
    });
    this.supportEventsService.emit({
      event: 'ticket_assigned',
      ticketId: ticket.id,
      userId: ticket.userId,
      actorUserId: Number(admin.sub),
      createdAt: new Date().toISOString(),
    });

    return this.getTicketByIdForAdmin(ticket.id, admin);
  }

  async updateStatusByAdmin(
    ticketId: string,
    dto: UpdateSupportTicketStatusDto,
    admin: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    const ticket = await this.requireTicket(ticketId);

    const closedAt =
      dto.status === SupportTicketStatus.CLOSED ? new Date() : null;

    await this.supportTicketRepo.update(ticket.id, {
      status: dto.status,
      assignedAdminUserId: ticket.assignedAdminUserId ?? Number(admin.sub),
      adminLastReadAt: new Date(),
      closedAt,
    });

    if (dto.note?.trim()) {
      const note = this.supportMessageRepo.create({
        ticketId: ticket.id,
        authorUserId: Number(admin.sub),
        authorRole: Role.ADMIN,
        message: dto.note.trim(),
        isInternal: true,
      });
      await this.supportMessageRepo.save(note);
      await this.supportTicketRepo.update(ticket.id, {
        lastMessageAt: note.createdAt,
      });
    }

    await this.notificationsService.create({
      userId: ticket.userId,
      type: NotificationType.SUPPORT_TICKET_STATUS_CHANGED,
      title: 'Support ticket status updated',
      body: `Your support ticket "${ticket.subject}" is now ${dto.status.replace('_', ' ')}.`,
      data: { ticketId: ticket.id, status: dto.status },
    });
    this.supportEventsService.emit({
      event: 'ticket_status_changed',
      ticketId: ticket.id,
      userId: ticket.userId,
      actorUserId: Number(admin.sub),
      status: dto.status,
      createdAt: new Date().toISOString(),
    });

    return this.getTicketByIdForAdmin(ticket.id, admin);
  }

  async addMessageAsAdmin(
    ticketId: string,
    dto: CreateSupportMessageDto,
    admin: ActiveUserData,
  ): Promise<SupportMessageResponseDto> {
    const ticket = await this.requireTicket(ticketId);
    const isInternal = dto.isInternal ?? false;

    const message = this.supportMessageRepo.create({
      ticketId: ticket.id,
      authorUserId: Number(admin.sub),
      authorRole: Role.ADMIN,
      message: dto.message.trim(),
      isInternal,
    });
    const saved = await this.supportMessageRepo.save(message);

    const nextStatus =
      !isInternal && ticket.status !== SupportTicketStatus.CLOSED
        ? SupportTicketStatus.WAITING_CUSTOMER
        : ticket.status;

    await this.supportTicketRepo.update(ticket.id, {
      assignedAdminUserId: ticket.assignedAdminUserId ?? Number(admin.sub),
      status: nextStatus,
      lastMessageAt: saved.createdAt,
      adminLastReadAt: saved.createdAt,
    });

    if (!isInternal) {
      await this.notificationsService.create({
        userId: ticket.userId,
        type: NotificationType.SUPPORT_MESSAGE_RECEIVED,
        title: 'New support reply',
        body: `Support team replied to ticket "${ticket.subject}".`,
        data: { ticketId: ticket.id },
      });
    }
    this.supportEventsService.emit({
      event: 'message_created',
      ticketId: ticket.id,
      userId: ticket.userId,
      actorUserId: Number(admin.sub),
      isInternalMessage: isInternal,
      createdAt: saved.createdAt.toISOString(),
    });

    return this.toMessageResponse(saved);
  }

  async getAdminUnreadCount(
    admin: ActiveUserData,
  ): Promise<SupportUnreadCountResponseDto> {
    const unreadCount = await this.getUnreadCountForAdmins(Number(admin.sub));
    return { unreadCount };
  }

  private async requireTicket(ticketId: string): Promise<SupportTicket> {
    const ticket = await this.supportTicketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    return ticket;
  }

  private async assertOrderOwnership(
    orderId: string | undefined,
    userId: number,
  ): Promise<void> {
    if (!orderId) {
      return;
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (!order) {
      throw new NotFoundException('Related order not found');
    }
    if (Number(order.user?.id) !== Number(userId)) {
      throw new ForbiddenException(
        'You are not allowed to create a ticket for this order',
      );
    }
  }

  private toTicketResponse(
    ticket: SupportTicket,
    lastMessagePreview: string | null,
    unreadCount: number,
  ): SupportTicketResponseDto {
    return {
      id: ticket.id,
      userId: ticket.userId,
      orderId: ticket.orderId ?? null,
      subject: ticket.subject,
      lastMessagePreview,
      unreadCount,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedAdminUserId: ticket.assignedAdminUserId ?? null,
      lastMessageAt: ticket.lastMessageAt ?? null,
      closedAt: ticket.closedAt ?? null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  private toMessageResponse(
    message: SupportMessage,
  ): SupportMessageResponseDto {
    return {
      id: message.id,
      ticketId: message.ticketId,
      authorUserId: message.authorUserId,
      authorRole: message.authorRole,
      message: message.message,
      isInternal: message.isInternal,
      createdAt: message.createdAt,
    };
  }

  private toTicketDetailsResponse(
    ticket: SupportTicket,
    includeInternalMessages: boolean,
  ): SupportTicketDetailsResponseDto {
    const messages = (ticket.messages ?? [])
      .filter((message) => includeInternalMessages || !message.isInternal)
      .map((message) => this.toMessageResponse(message));

    return {
      ...this.toTicketResponse(ticket, messages.at(-1)?.message ?? null, 0),
      messages,
    };
  }

  private async markTicketReadByUser(
    ticketId: string,
    userId: number,
  ): Promise<void> {
    await this.markMessagesAsRead(ticketId, Role.USER, userId);
  }

  private async markTicketReadByAdmin(
    ticketId: string,
    adminUserId: number,
  ): Promise<void> {
    await this.markMessagesAsRead(ticketId, Role.ADMIN, adminUserId);
  }

  private async buildTicketSummary(
    tickets: SupportTicket[],
    viewerRole: Role,
    viewerUserId: number,
  ): Promise<{
    previewByTicketId: Record<string, string | null>;
    unreadByTicketId: Record<string, number>;
  }> {
    const ticketIds = tickets.map((ticket) => ticket.id);
    if (ticketIds.length === 0) {
      return { previewByTicketId: {}, unreadByTicketId: {} };
    }

    const previewByTicketId: Record<string, string | null> = {};
    const unreadByTicketId: Record<string, number> = {};

    for (const ticket of tickets) {
      previewByTicketId[ticket.id] = null;
      unreadByTicketId[ticket.id] = 0;
    }

    const allMessages = await this.supportMessageRepo
      .createQueryBuilder('message')
      .where('message.ticketId IN (:...ticketIds)', { ticketIds })
      .orderBy('message.createdAt', 'ASC')
      .getMany();

    for (const message of allMessages) {
      const trimmedPreview =
        message.message.length > 80
        ? `${message.message.slice(0, 77)}...`
        : message.message;
      previewByTicketId[message.ticketId] = trimmedPreview;
    }

    const unreadRows = await this.supportMessageRepo
      .createQueryBuilder('message')
      .leftJoin(
        SupportMessageRead,
        'messageRead',
        'messageRead.messageId = message.id AND messageRead.userId = :viewerUserId',
        { viewerUserId },
      )
      .select('message.ticketId', 'ticketId')
      .addSelect('COUNT(message.id)', 'unreadCount')
      .where('message.ticketId IN (:...ticketIds)', { ticketIds })
      .andWhere('messageRead.id IS NULL')
      .andWhere(
        viewerRole === Role.USER
          ? 'message.authorRole = :authorRole AND message.isInternal = false'
          : 'message.authorRole = :authorRole',
        { authorRole: viewerRole === Role.USER ? Role.ADMIN : Role.USER },
      )
      .groupBy('message.ticketId')
      .getRawMany<{ ticketId: string; unreadCount: string }>();

    for (const row of unreadRows) {
      unreadByTicketId[row.ticketId] = Number(row.unreadCount);
    }

    return { previewByTicketId, unreadByTicketId };
  }

  private async getUnreadCountForUser(userId: number): Promise<number> {
    const rows = await this.supportMessageRepo
      .createQueryBuilder('message')
      .innerJoin(
        SupportTicket,
        'ticket',
        'ticket.id = message.ticketId AND ticket.userId = :userId',
        { userId },
      )
      .leftJoin(
        SupportMessageRead,
        'messageRead',
        'messageRead.messageId = message.id AND messageRead.userId = :userId',
        { userId },
      )
      .where('message.authorRole = :authorRole', { authorRole: Role.ADMIN })
      .andWhere('message.isInternal = false')
      .andWhere('messageRead.id IS NULL')
      .getCount();
    return rows;
  }

  private async getUnreadCountForAdmins(adminUserId: number): Promise<number> {
    const rows = await this.supportMessageRepo
      .createQueryBuilder('message')
      .leftJoin(
        SupportMessageRead,
        'messageRead',
        'messageRead.messageId = message.id AND messageRead.userId = :adminUserId',
        { adminUserId },
      )
      .where('message.authorRole = :authorRole', { authorRole: Role.USER })
      .andWhere('messageRead.id IS NULL')
      .getCount();
    return rows;
  }

  private async markMessagesAsRead(
    ticketId: string,
    readerRole: Role,
    readerUserId: number,
  ): Promise<void> {
    const unreadMessages = await this.supportMessageRepo
      .createQueryBuilder('message')
      .leftJoin(
        SupportMessageRead,
        'messageRead',
        'messageRead.messageId = message.id AND messageRead.userId = :readerUserId',
        { readerUserId },
      )
      .select(['message.id AS id'])
      .where('message.ticketId = :ticketId', { ticketId })
      .andWhere('messageRead.id IS NULL')
      .andWhere(
        readerRole === Role.USER
          ? 'message.authorRole = :authorRole AND message.isInternal = false'
          : 'message.authorRole = :authorRole',
        { authorRole: readerRole === Role.USER ? Role.ADMIN : Role.USER },
      )
      .getRawMany<{ id: string }>();

    if (unreadMessages.length === 0) {
      return;
    }

    const reads = unreadMessages.map((message) => ({
      messageId: message.id,
      ticketId,
      userId: readerUserId,
      readerRole,
    }));

    await this.supportMessageReadRepo
      .createQueryBuilder()
      .insert()
      .into(SupportMessageRead)
      .values(reads)
      .orIgnore()
      .execute();
  }
}
