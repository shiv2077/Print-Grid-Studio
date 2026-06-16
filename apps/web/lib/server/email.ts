import { formatINR } from '@printgrid/pricing';
import { filesForOrder } from './orders';
import type { OrderRow } from './schema';

export interface EmailResult {
  sent: boolean;
  reason?: string;
}

/** Confirmation email on `paid`. No-ops (logged) without a Resend key or email. */
export async function sendOrderConfirmation(order: OrderRow): Promise<EmailResult> {
  if (!order.email) return { sent: false, reason: 'no customer email' };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'PrintGrid Studio <orders@printgrid.co.in>';
  const files = await filesForOrder(order.id);

  const lines = files
    .map((f) => `<li>${f.filename ?? 'model'} — ${f.materialKey ?? '?'} ×${f.qty}</li>`)
    .join('');
  const html = `
    <h2>Order ${order.orderCode} confirmed</h2>
    <p>Thank you — your payment has been received.</p>
    <ul>${lines}</ul>
    <p><strong>Total paid: ${formatINR(order.amountPaise)}</strong> (incl. 18% GST)</p>
    <p>We'll email you tracking once your print ships.</p>`;

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY missing — confirmation for ${order.orderCode} NOT sent`);
    return { sent: false, reason: 'RESEND_API_KEY not set' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: order.email, subject: `PrintGrid Studio — order ${order.orderCode} confirmed`, html }),
  });
  if (!res.ok) {
    console.error(`[email] Resend failed for ${order.orderCode}: ${res.status}`);
    return { sent: false, reason: `resend ${res.status}` };
  }
  return { sent: true };
}
