import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './providers/orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import * as activeUserDataInterface from 'src/auth/interface/active-user-data.interface';
import { OrderResponseDto } from './dtos/order-response.dto';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { OrderQuoteResponseDto } from './dtos/order-quote-response.dto';
import { Roles } from 'src/auth/decorator/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UpdateDeliveryTrackingDto } from './dtos/update-delivery-tracking.dto';
import { DeliveryTrackingResponseDto } from './dtos/delivery-tracking-response.dto';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Create order from current cart with shipping details',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(user, dto);
  }

  @Post('quote')
  @ApiOperation({ summary: 'Quote order total before checkout' })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Shipping details used to quote final total',
  })
  @ApiResponse({
    status: 201,
    description: 'Order quote calculated successfully',
    type: OrderQuoteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  quote(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.quoteOrder(user, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
    type: [OrderResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  myOrders(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.orderService.getUserOrders(user, paginationQuery);
  }

  // Backward-compatible alias used by some frontend calls (e.g. /orders/).
  @Get()
  @ApiOperation({ summary: 'Get current user orders (alias)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
    type: [OrderResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  myOrdersAlias(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.orderService.getUserOrders(user, paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
  ) {
    return this.orderService.getOrderById(id, user);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get order delivery tracking details' })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tracking details retrieved successfully',
    type: DeliveryTrackingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  tracking(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
  ) {
    return this.orderService.getTracking(id, user);
  }

  @Patch(':id/tracking')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order delivery tracking (Admin)' })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateDeliveryTrackingDto })
  @ApiResponse({
    status: 200,
    description: 'Delivery tracking updated successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  patchTracking(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDeliveryTrackingDto,
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
  ) {
    return this.orderService.updateDeliveryTracking(id, dto, user);
  }

  // Backward-compatible legacy route for existing clients using POST.
  @Post(':id/tracking')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update order delivery tracking (Admin, legacy POST)',
  })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateDeliveryTrackingDto })
  @ApiResponse({
    status: 200,
    description: 'Delivery tracking updated successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  updateTracking(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDeliveryTrackingDto,
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
  ) {
    return this.orderService.updateDeliveryTracking(id, dto, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel current user unpaid order' })
  @ApiParam({
    name: 'id',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be cancelled in current status',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  cancelMyOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
  ) {
    return this.orderService.cancelMyOrder(id, user);
  }
}
