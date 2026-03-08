import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from 'src/payments/enums/PaymentStatus.enum';

export class WebhookProcessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ required: false, enum: PaymentStatus, nullable: true })
  status?: PaymentStatus;

  @ApiProperty({ required: false, example: false, nullable: true })
  duplicate?: boolean;
}
