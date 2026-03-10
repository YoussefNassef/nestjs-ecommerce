import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, NotEquals } from 'class-validator';
import { StockAdjustmentReason } from '../enums/stock-adjustment-reason.enum';

export class AdjustProductStockDto {
  @ApiProperty({
    description: 'Positive to increase stock, negative to decrease stock',
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  delta: number;

  @ApiPropertyOptional({
    enum: StockAdjustmentReason,
    example: StockAdjustmentReason.RESTOCK,
  })
  @IsOptional()
  @IsEnum(StockAdjustmentReason)
  reason?: StockAdjustmentReason;

  @ApiPropertyOptional({ example: 'INV-9032' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  reference?: string;

  @ApiPropertyOptional({ example: 'Manual correction after warehouse count' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

