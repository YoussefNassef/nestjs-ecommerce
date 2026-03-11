import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { Roles } from 'src/auth/decorator/role.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Role } from 'src/auth/enums/role.enum';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { Observable, map } from 'rxjs';
import { CreateSupportMessageDto } from './dtos/create-support-message.dto';
import { SupportMessageResponseDto } from './dtos/support-message-response.dto';
import {
  SupportTicketDetailsResponseDto,
  SupportTicketResponseDto,
} from './dtos/support-ticket-response.dto';
import { SupportTicketListQueryDto } from './dtos/support-ticket-list-query.dto';
import { SupportUnreadCountResponseDto } from './dtos/support-unread-count-response.dto';
import { UpdateSupportTicketStatusDto } from './dtos/update-support-ticket-status.dto';
import { RequireBearerHeaderGuard } from './guards/require-bearer-header.guard';
import { SupportEventsService } from './providers/support-events.service';
import { SupportService } from './providers/support.service';

@ApiTags('admin-support')
@ApiBearerAuth('JWT-auth')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
@Controller('admin/support/tickets')
export class AdminSupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly supportEventsService: SupportEventsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List support tickets (admin)' })
  @ApiResponse({ status: 200 })
  listTickets(
    @Query() query: SupportTicketListQueryDto,
    @ActiveUser() admin: ActiveUserData,
  ): Promise<PaginatedResponse<SupportTicketResponseDto>> {
    return this.supportService.listTicketsForAdmin(query, admin);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get admin unread support messages count' })
  @ApiResponse({ status: 200, type: SupportUnreadCountResponseDto })
  getUnreadCount(
    @ActiveUser() admin: ActiveUserData,
  ): Promise<SupportUnreadCountResponseDto> {
    return this.supportService.getAdminUnreadCount(admin);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream for admin support queue updates' })
  @UseGuards(RequireBearerHeaderGuard)
  stream(): Observable<MessageEvent> {
    return this.supportEventsService.stream().pipe(
      map((event) => ({
        type: event.event,
        data: event,
      })),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get support ticket details (admin)' })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, type: SupportTicketDetailsResponseDto })
  getTicketById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() admin: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    return this.supportService.getTicketByIdForAdmin(id, admin);
  }

  @Patch(':id/assign-me')
  @ApiOperation({ summary: 'Assign support ticket to current admin' })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, type: SupportTicketDetailsResponseDto })
  assignToMe(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() admin: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    return this.supportService.assignToMe(id, admin);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update support ticket status (admin)' })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateSupportTicketStatusDto })
  @ApiResponse({ status: 200, type: SupportTicketDetailsResponseDto })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSupportTicketStatusDto,
    @ActiveUser() admin: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    return this.supportService.updateStatusByAdmin(id, dto, admin);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add support message as admin' })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: CreateSupportMessageDto })
  @ApiResponse({ status: 201, type: SupportMessageResponseDto })
  addMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateSupportMessageDto,
    @ActiveUser() admin: ActiveUserData,
  ): Promise<SupportMessageResponseDto> {
    return this.supportService.addMessageAsAdmin(id, dto, admin);
  }
}
