import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { QuoteController } from './quote/quote.controller';

@Module({
  controllers: [HealthController, QuoteController],
})
export class AppModule {}
