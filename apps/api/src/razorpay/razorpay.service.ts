import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

@Injectable()
export class RazorpayService {
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    this.keyId = config.getOrThrow<string>('RAZORPAY_KEY_ID');
    this.keySecret = config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
    this.webhookSecret = config.get<string>('RAZORPAY_WEBHOOK_SECRET') ?? '';
  }

  /** key_id is safe to expose to the browser (Checkout needs it). */
  get publicKeyId(): string {
    return this.keyId;
  }

  /** Create a Razorpay order for a SERVER-computed amount in paise. */
  async createOrder(amountPaise: number, receipt: string): Promise<RazorpayOrder> {
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      throw new Error(`Invalid Razorpay amount (paise): ${amountPaise}`);
    }
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
    });
    if (!res.ok) {
      throw new Error(`Razorpay order creation failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as RazorpayOrder;
  }

  /**
   * M2.5 security boundary. Verify a webhook's HMAC-SHA256 signature over the
   * RAW body using constant-time comparison. Returns false on any mismatch or
   * if no webhook secret is configured.
   */
  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader: string): boolean {
    if (!this.webhookSecret || !signatureHeader) return false;
    const expected = createHmac('sha256', this.webhookSecret)
      .update(typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody)
      .digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signatureHeader, 'utf8');
    if (a.length !== b.length) return false; // timingSafeEqual requires equal length
    return timingSafeEqual(a, b);
  }
}
