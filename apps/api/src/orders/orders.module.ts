import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { RazorpayModule } from '../razorpay/razorpay.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [RazorpayModule, StorageModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
