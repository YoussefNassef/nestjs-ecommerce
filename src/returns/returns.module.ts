import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/orders.entity';
import { ReturnRequest } from './return-request.entity';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './providers/returns.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReturnRequest, Order])],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
