import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ReturnRequestStatus } from '../enums/return-request-status.enum';

export class UpdateReturnRequestStatusDto {
  @ApiProperty({
    description: 'Next status for return request',
    enum: ReturnRequestStatus,
    example: ReturnRequestStatus.APPROVED,
  })
  @IsEnum(ReturnRequestStatus)
  status: ReturnRequestStatus;

  @ApiPropertyOptional({
    description: 'Optional admin note',
    example: 'Approved after quality validation.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  adminNote?: string;

  @ApiPropertyOptional({
    description: 'Optional refund amount override',
    example: 11000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  refundAmount?: number;
}
