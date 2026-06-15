import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { QuoteController } from './quote/quote.controller';
import { DbModule } from './db/db.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    OrdersModule,
  ],
  controllers: [HealthController, QuoteController],
})
export class AppModule {}
