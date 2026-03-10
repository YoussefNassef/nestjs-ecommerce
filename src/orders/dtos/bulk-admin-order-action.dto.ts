import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminOrderActionDto } from './admin-order-action.dto';

export class BulkAdminOrderActionDto {
  @ApiProperty({
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  orderIds: string[];

  @ApiProperty({ type: AdminOrderActionDto })
  @ValidateNested()
  @Type(() => AdminOrderActionDto)
  action: AdminOrderActionDto;
}

