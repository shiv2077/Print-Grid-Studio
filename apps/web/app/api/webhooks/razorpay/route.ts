import { verifyWebhookSignature } from '@/lib/server/razorpay';
import { findOrderByRazorpayId, markPaidIfPending } from '@/lib/server/orders';
import { sendOrderConfirmation } from '@/lib/server/email';

export const runtime = 'nodejs';

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

export async function POST(req: Request) {
  // RAW bytes — never a parsed body — are what the HMAC is computed over.
  const raw = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  if (!verifyWebhookSignature(raw, signature)) {
    return Response.json({ error: 'invalid signature' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const ex = extract(event);
  if (!ex.razorpayOrderId) {
    return Response.json({ status: `ignored ${event?.event ?? 'unknown'}` });
  }

  const order = await findOrderByRazorpayId(ex.razorpayOrderId);
  if (!order) return Response.json({ status: 'order not found (ack)' });

  // Captured amount must equal the server-charged amount. Mismatch = tampering.
  if (ex.amountPaise !== order.amountPaise) {
    return Response.json({ error: 'amount mismatch' }, { status: 400 });
  }

  const flipped = await markPaidIfPending(ex.razorpayOrderId, ex.razorpayPaymentId ?? 'unknown');
  if (!flipped) return Response.json({ status: 'already processed' });

  try {
    await sendOrderConfirmation(flipped);
  } catch (e) {
    console.error('[webhook] email failed:', (e as Error).message);
  }
  return Response.json({ status: 'paid' });
}
