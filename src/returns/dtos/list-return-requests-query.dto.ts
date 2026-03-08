import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReturnRequestStatus } from '../enums/return-request-status.enum';

export class ListReturnRequestsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter return requests by status',
    enum: ReturnRequestStatus,
  })
  @IsOptional()
  @IsEnum(ReturnRequestStatus)
  status?: ReturnRequestStatus;
}
