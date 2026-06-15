import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatINR } from '@printgrid/pricing';
import { OrdersRepository } from '../orders/orders.repository';
import type { OrderRow } from '../db/schema';

export interface EmailResult {
  sent: boolean;
  reason?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly from: string;

  constructor(
    config: ConfigService,
    private readonly repo: OrdersRepository,
  ) {
    this.apiKey = config.get<string>('RESEND_API_KEY') ?? '';
    this.from = config.get<string>('RESEND_FROM') ?? 'PrintGrid Studio <orders@printgrid.co.in>';
  }

  /** Confirmation email on `paid`. No-ops (logged) when no Resend key or email. */
  async sendOrderConfirmation(order: OrderRow): Promise<EmailResult> {
    if (!order.email) return { sent: false, reason: 'no customer email on order' };
    const files = await this.repo.filesForOrder(order.id);
    const html = this.render(order, files);

    if (!this.apiKey) {
      // Build is complete but unsendable until a Resend key + verified domain exist.
      this.logger.warn(`RESEND_API_KEY missing — confirmation for ${order.orderCode} NOT sent`);
      return { sent: false, reason: 'RESEND_API_KEY not configured' };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.from,
        to: order.email,
        subject: `PrintGrid Studio — order ${order.orderCode} confirmed`,
        html,
      }),
    });
    if (!res.ok) {
      this.logger.error(`Resend failed for ${order.orderCode}: ${res.status} ${await res.text()}`);
      return { sent: false, reason: `resend ${res.status}` };
    }
    return { sent: true };
  }

  private render(order: OrderRow, files: Array<{ filename: string | null; materialKey: string | null; qty: number }>): string {
    const lines = files
      .map((f) => `<li>${f.filename ?? 'model.stl'} — ${f.materialKey ?? '?'} ×${f.qty}</li>`)
      .join('');
    return `
      <h2>Order ${order.orderCode} confirmed</h2>
      <p>Thank you — your payment has been received.</p>
      <ul>${lines}</ul>
      <p><strong>Total paid: ${formatINR(order.amountPaise)}</strong> (incl. 18% GST)</p>
      <p>We'll email you tracking once your print ships.</p>
    `;
  }
}
