import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './providers/health.service';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
