import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './providers/orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import * as activeUserDataInterface from 'src/auth/interface/active-user-data.interface';
import { OrderResponseDto } from './dtos/order-response.dto';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Create order from current cart (no fields required)',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@ActiveUser() user: activeUserDataInterface.ActiveUserData) {
    return this.orderService.createOrder(user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
    type: [OrderResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  myOrders(@ActiveUser() user: activeUserDataInterface.ActiveUserData) {
    return this.orderService.getUserOrders(user);
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
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }
}
