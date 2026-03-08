import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class UpdateDeliveryTrackingDto {
  @ApiProperty({
    description: 'New delivery status',
    enum: DeliveryStatus,
    example: DeliveryStatus.SHIPPED,
  })
  @IsEnum(DeliveryStatus)
  deliveryStatus: DeliveryStatus;

  @ApiPropertyOptional({
    description: 'Carrier tracking number',
    example: 'TRK-93820393',
  })
  @IsOptional()
  @IsString()
  @Length(3, 128)
  trackingNumber?: string;

  @ApiPropertyOptional({
    description: 'Shipping carrier name',
    example: 'Aramex',
  })
  @IsOptional()
  @IsString()
  @Length(2, 128)
  shippingCarrier?: string;

  @ApiPropertyOptional({
    description: 'Public tracking URL',
    example: 'https://tracking.example.com/TRK-93820393',
  })
  @IsOptional()
  @IsUrl()
  @Length(10, 2048)
  trackingUrl?: string;

  @ApiPropertyOptional({
    description: 'Package current location',
    example: 'Riyadh Hub',
  })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  currentLocation?: string;

  @ApiPropertyOptional({
    description: 'Tracking note',
    example: 'Package sorted and moved to outbound truck',
  })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  trackingNote?: string;

  @ApiPropertyOptional({
    description: 'Estimated delivery datetime',
    example: '2026-03-10T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string;
}
