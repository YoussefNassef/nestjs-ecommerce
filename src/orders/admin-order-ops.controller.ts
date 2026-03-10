import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { Roles } from 'src/auth/decorator/role.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Role } from 'src/auth/enums/role.enum';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { AdminOrderOpsProvider } from './providers/admin-order-ops.provider';
import { CreateOrderAdminNoteDto } from './dtos/create-order-admin-note.dto';
import { AdminOrderActionDto } from './dtos/admin-order-action.dto';
import { OrderAdminAuditQueryDto } from './dtos/order-admin-audit-query.dto';
import { BulkAdminOrderActionDto } from './dtos/bulk-admin-order-action.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { OrderAdminAudit } from './entities/order-admin-audit.entity';

@ApiTags('admin-orders')
@ApiBearerAuth('JWT-auth')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
@Controller('admin/orders')
export class AdminOrderOpsController {
  constructor(private readonly adminOrderOpsProvider: AdminOrderOpsProvider) {}

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add admin note to order operations log' })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: CreateOrderAdminNoteDto })
  @ApiResponse({ status: 201, description: 'Order note logged successfully' })
  addNote(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateOrderAdminNoteDto,
    @ActiveUser() admin: ActiveUserData,
  ) {
    return this.adminOrderOpsProvider.addAdminNote(id, dto, admin);
  }

  @Post(':id/actions')
  @ApiOperation({ summary: 'Execute admin action for order workflow' })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: AdminOrderActionDto })
  @ApiResponse({ status: 200, description: 'Order action executed successfully' })
  runAction(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminOrderActionDto,
    @ActiveUser() admin: ActiveUserData,
  ) {
    return this.adminOrderOpsProvider.performAction(id, dto, admin);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'List admin audit trail for specific order' })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Order audit list retrieved successfully' })
  getAudit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: OrderAdminAuditQueryDto,
  ): Promise<PaginatedResponse<OrderAdminAudit>> {
    return this.adminOrderOpsProvider.listAudit(id, query);
  }

  @Post('bulk-actions')
  @ApiOperation({ summary: 'Execute same admin action over multiple orders' })
  @ApiBody({ type: BulkAdminOrderActionDto })
  @ApiResponse({ status: 200, description: 'Bulk action processed' })
  bulkActions(
    @Body() dto: BulkAdminOrderActionDto,
    @ActiveUser() admin: ActiveUserData,
  ) {
    return this.adminOrderOpsProvider.performBulkAction(dto, admin);
  }
}

