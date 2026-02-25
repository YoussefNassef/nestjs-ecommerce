import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './providers/payments.service';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { CreatePaymentDto } from './dtos/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('moyasar')
  @Auth(AuthType.None)
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }
}
