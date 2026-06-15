import { Injectable, Logger } from '@nestjs/common';
import { RazorpayService } from '../razorpay/razorpay.service';
import { OrdersRepository } from '../orders/orders.repository';
import { EmailService } from '../email/email.service';

export interface WebhookOutcome {
  ok: boolean;
  status: number;
  message: string;
}

interface ExtractedEvent {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amountPaise?: number;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly razorpay: RazorpayService,
    private readonly repo: OrdersRepository,
    private readonly email: EmailService,
  ) {}

  /**
   * The ONLY path that can mark an order paid. Verifies the HMAC signature over
   * the raw body first; then confirms the captured amount equals the stored
   * server amount; then flips pending->paid idempotently.
   */
  async handle(rawBody: Buffer, signature: string): Promise<WebhookOutcome> {
    // 1. Signature is the gate. Reject anything that doesn't verify.
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      return { ok: false, status: 400, message: 'invalid signature' };
    }

    let event: any;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return { ok: false, status: 400, message: 'invalid json' };
    }

    const extracted = this.extract(event);
    if (!extracted.razorpayOrderId) {
      // Verified but not a payment event we act on — acknowledge so Razorpay stops retrying.
      return { ok: true, status: 200, message: `ignored event ${event?.event ?? 'unknown'}` };
    }

    const order = await this.repo.findByRazorpayOrderId(extracted.razorpayOrderId);
    if (!order) {
      this.logger.warn(`webhook for unknown razorpay order ${extracted.razorpayOrderId}`);
      return { ok: true, status: 200, message: 'order not found (ack)' };
    }

    // 2. Amount must match what the server charged. A mismatch is tampering.
    if (extracted.amountPaise !== order.amountPaise) {
      this.logger.error(
        `amount mismatch for ${order.orderCode}: captured ${extracted.amountPaise} vs stored ${order.amountPaise}`,
      );
      return { ok: false, status: 400, message: 'amount mismatch' };
    }

    // 3. Idempotent flip: only the transition pending->paid happens, and only once.
    const flipped = await this.repo.markPaidIfPending(
      extracted.razorpayOrderId,
      extracted.razorpayPaymentId ?? 'unknown',
    );
    if (!flipped) {
      return { ok: true, status: 200, message: 'already processed' };
    }

    // 4. Side effects only on the real transition.
    try {
      await this.email.sendOrderConfirmation(flipped);
    } catch (err) {
      this.logger.error(`confirmation email failed for ${flipped.orderCode}: ${(err as Error).message}`);
      // Email failure must not fail the webhook (Razorpay would retry and double-process side effects).
    }
    return { ok: true, status: 200, message: 'paid' };
  }

  private extract(event: any): ExtractedEvent {
    const name = event?.event;
    if (name === 'payment.captured') {
      const e = event?.payload?.payment?.entity;
      return { razorpayOrderId: e?.order_id, razorpayPaymentId: e?.id, amountPaise: e?.amount };
    }
    if (name === 'order.paid') {
      const o = event?.payload?.order?.entity;
      const p = event?.payload?.payment?.entity;
      return { razorpayOrderId: o?.id, razorpayPaymentId: p?.id, amountPaise: p?.amount ?? o?.amount };
    }
    return {};
  }
}
