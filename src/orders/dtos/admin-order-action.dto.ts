import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from '../enum/order.status.enum';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { AdminOrderActionType } from '../enums/order-admin-audit-action.enum';

export class AdminOrderActionDto {
  @ApiProperty({
    enum: AdminOrderActionType,
    example: AdminOrderActionType.UPDATE_ORDER_STATUS,
  })
  @IsEnum(AdminOrderActionType)
  action: AdminOrderActionType;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Required when action is update_order_status',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({
    enum: DeliveryStatus,
    description: 'Required when action is update_delivery_tracking',
  })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  deliveryStatus?: DeliveryStatus;

  @ApiPropertyOptional({ example: 'TRK-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'Aramex' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  shippingCarrier?: string;

  @ApiPropertyOptional({ example: 'https://tracking.example.com/TRK-12345' })
  @IsOptional()
  @IsUrl()
  trackingUrl?: string;

  @ApiPropertyOptional({ example: 'Riyadh Hub' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  currentLocation?: string;

  @ApiPropertyOptional({ example: 'Package ready for dispatch' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  trackingNote?: string;

  @ApiPropertyOptional({
    example: '2026-03-15T12:00:00.000Z',
  })
  @IsOptional()
  @Type(() => String)
  @IsDateString()
  estimatedDeliveryAt?: string;

  @ApiPropertyOptional({
    description: 'Optional admin note included in audit entry',
    example: 'Handled after support escalation',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  note?: string;
}

