import { verifyWebhookSignature } from './razorpay';
import { findOrderByRazorpayId, markPaidIfPending } from './orders';
import { sendOrderConfirmation } from './email';
import type { OrderRow } from './schema';

export interface WebhookOutcome {
  ok: boolean;
  status: number;
  message: string;
}

export interface WebhookDeps {
  verify: (raw: Buffer, sig: string) => boolean;
  findByRzpId: (id: string) => Promise<OrderRow | null>;
  markPaid: (id: string, paymentId: string) => Promise<OrderRow | null>;
  sendEmail: (order: OrderRow) => Promise<unknown>;
}

const defaultDeps: WebhookDeps = {
  verify: verifyWebhookSignature,
  findByRzpId: findOrderByRazorpayId,
  markPaid: markPaidIfPending,
  sendEmail: sendOrderConfirmation,
};

interface Extracted {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amountPaise?: number;
}

function extract(event: any): Extracted {
  if (event?.event === 'payment.captured') {
    const e = event?.payload?.payment?.entity;
    return { razorpayOrderId: e?.order_id, razorpayPaymentId: e?.id, amountPaise: e?.amount };
  }
  if (event?.event === 'order.paid') {
    const o = event?.payload?.order?.entity;
    const p = event?.payload?.payment?.entity;
    return { razorpayOrderId: o?.id, razorpayPaymentId: p?.id, amountPaise: p?.amount ?? o?.amount };
  }
  return {};
}

/**
 * The Razorpay webhook decision logic — the security boundary. Signature first,
 * then server-amount match, then idempotent pending->paid. Deps are injectable
 * for tests; the route handler uses the defaults.
 */
export async function handleRazorpayWebhook(
  rawBody: Buffer,
  signature: string,
  deps: WebhookDeps = defaultDeps,
): Promise<WebhookOutcome> {
  if (!deps.verify(rawBody, signature)) {
    return { ok: false, status: 400, message: 'invalid signature' };
  }
  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return { ok: false, status: 400, message: 'invalid json' };
  }
  const ex = extract(event);
  if (!ex.razorpayOrderId) {
    return { ok: true, status: 200, message: `ignored ${event?.event ?? 'unknown'}` };
  }
  const order = await deps.findByRzpId(ex.razorpayOrderId);
  if (!order) return { ok: true, status: 200, message: 'order not found (ack)' };
  if (ex.amountPaise !== order.amountPaise) {
    return { ok: false, status: 400, message: 'amount mismatch' };
  }
  const flipped = await deps.markPaid(ex.razorpayOrderId, ex.razorpayPaymentId ?? 'unknown');
  if (!flipped) return { ok: true, status: 200, message: 'already processed' };
  try {
    await deps.sendEmail(flipped);
  } catch (e) {
    console.error('[webhook] email failed:', (e as Error).message);
  }
  return { ok: true, status: 200, message: 'paid' };
}
