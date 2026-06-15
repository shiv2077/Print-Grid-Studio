import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { RazorpayModule } from '../razorpay/razorpay.module';
import { OrdersModule } from '../orders/orders.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [RazorpayModule, OrdersModule, EmailModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
