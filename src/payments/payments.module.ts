import { Module } from '@nestjs/common';
import { PaymentsService } from './providers/payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payments.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { CreatePaymentProvider } from './providers/create-payment.provider';
import { MoyasarResHttpProvider } from './providers/moyasar-res-http.provider';
import { GetPaymentByIdProvider } from './providers/get-payment-by-id.provider';
import { UpdatePaymentStatusProvider } from './providers/update-payment-status.provider';

@Module({
  providers: [PaymentsService, CreatePaymentProvider, MoyasarResHttpProvider, GetPaymentByIdProvider, UpdatePaymentStatusProvider],
  controllers: [PaymentsController],
  imports: [OrdersModule, TypeOrmModule.forFeature([Payment])],
  exports: [PaymentsService],
})
export class PaymentsModule {}
