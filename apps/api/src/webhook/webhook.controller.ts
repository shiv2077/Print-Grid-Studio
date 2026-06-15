import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { WebhookService } from './webhook.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhook: WebhookService) {}

  @Post('razorpay')
  @HttpCode(200)
  async razorpay(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    // The RAW bytes — never the JSON-parsed body — are what the HMAC is computed over.
    const raw = req.rawBody;
    if (!raw) throw new BadRequestException('missing raw body');
    const outcome = await this.webhook.handle(raw, signature ?? '');
    if (!outcome.ok) throw new BadRequestException(outcome.message);
    return { status: outcome.message };
  }
}
