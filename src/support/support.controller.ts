import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseUUIDPipe,
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
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { Observable, filter, map } from 'rxjs';
import { CreateSupportMessageDto } from './dtos/create-support-message.dto';
import { CreateSupportTicketDto } from './dtos/create-support-ticket.dto';
import { SupportMessageResponseDto } from './dtos/support-message-response.dto';
import {
  SupportTicketDetailsResponseDto,
  SupportTicketResponseDto,
} from './dtos/support-ticket-response.dto';
import { SupportTicketListQueryDto } from './dtos/support-ticket-list-query.dto';
import { SupportUnreadCountResponseDto } from './dtos/support-unread-count-response.dto';
import { RequireBearerHeaderGuard } from './guards/require-bearer-header.guard';
import { SupportEventsService } from './providers/support-events.service';
import { SupportService } from './providers/support.service';

@ApiTags('support')
@ApiBearerAuth('JWT-auth')
@Auth(AuthType.Bearer)
@Controller('support/tickets')
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly supportEventsService: SupportEventsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create support ticket' })
  @ApiBody({ type: CreateSupportTicketDto })
  @ApiResponse({ status: 201, type: SupportTicketDetailsResponseDto })
  createTicket(
    @ActiveUser() user: ActiveUserData,
    @Body() dto: CreateSupportTicketDto,
  ): Promise<SupportTicketDetailsResponseDto> {
    return this.supportService.createTicket(user, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my support tickets' })
  @ApiResponse({ status: 200 })
  listMyTickets(
    @ActiveUser() user: ActiveUserData,
    @Query() query: SupportTicketListQueryDto,
  ): Promise<PaginatedResponse<SupportTicketResponseDto>> {
    return this.supportService.listMyTickets(user, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get my unread support messages count' })
  @ApiResponse({ status: 200, type: SupportUnreadCountResponseDto })
  getMyUnreadCount(
    @ActiveUser() user: ActiveUserData,
  ): Promise<SupportUnreadCountResponseDto> {
    return this.supportService.getMyUnreadCount(user);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream for my support ticket updates' })
  @UseGuards(RequireBearerHeaderGuard)
  stream(@ActiveUser() user: ActiveUserData): Observable<MessageEvent> {
    const userId = Number(user.sub);
    return this.supportEventsService.stream().pipe(
      filter((event) => event.userId === userId && !event.isInternalMessage),
      map((event) => ({
        type: event.event,
        data: event,
      })),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get my support ticket details' })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, type: SupportTicketDetailsResponseDto })
  getMyTicketById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    return this.supportService.getMyTicketById(id, user);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to my support ticket' })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: CreateSupportMessageDto })
  @ApiResponse({ status: 201, type: SupportMessageResponseDto })
  addMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateSupportMessageDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<SupportMessageResponseDto> {
    return this.supportService.addMessageAsUser(id, user, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close my support ticket' })
  @ApiResponse({ status: 200, type: SupportTicketDetailsResponseDto })
  closeTicket(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    return this.supportService.closeMyTicket(id, user);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen my support ticket' })
  @ApiResponse({ status: 200, type: SupportTicketDetailsResponseDto })
  reopenTicket(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<SupportTicketDetailsResponseDto> {
    return this.supportService.reopenMyTicket(id, user);
  }
}
