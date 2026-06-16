import { describe, expect, it } from 'vitest';
import { handleRazorpayWebhook, type WebhookDeps } from '../lib/server/webhook';

function setup() {
  const order: any = {
    id: 'u1',
    orderCode: 'PG-T',
    amountPaise: 32538,
    status: 'pending',
    razorpayOrderId: 'order_X',
    razorpayPaymentId: null,
    email: 'b@x.com',
  };
  const emails: string[] = [];
  const deps: WebhookDeps = {
    verify: (_raw, sig) => sig === 'good', // stand-in for the real HMAC check
    findByRzpId: async (id) => (id === 'order_X' ? order : null),
    markPaid: async (id, pid) => {
      if (id === 'order_X' && order.status === 'pending') {
        order.status = 'paid';
        order.razorpayPaymentId = pid;
        return order;
      }
      return null;
    },
    sendEmail: async (o) => {
      emails.push(o.orderCode);
    },
  };
  return { order, emails, deps };
}

function body(orderId: string, amount: number): Buffer {
  return Buffer.from(
    JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: orderId, amount, status: 'captured' } } } }),
  );
}

describe('handleRazorpayWebhook (security boundary)', () => {
  it('rejects a forged signature and changes nothing', async () => {
    const { order, emails, deps } = setup();
    const r = await handleRazorpayWebhook(body('order_X', 32538), 'bad', deps);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(order.status).toBe('pending');
    expect(emails).toHaveLength(0);
  });

  it('flips pending -> paid on a valid signature and sends one email', async () => {
    const { order, emails, deps } = setup();
    const r = await handleRazorpayWebhook(body('order_X', 32538), 'good', deps);
    expect(r.status).toBe(200);
    expect(order.status).toBe('paid');
    expect(order.razorpayPaymentId).toBe('pay_1');
    expect(emails).toEqual(['PG-T']);
  });

  it('is idempotent: same event twice flips once, emails once', async () => {
    const { order, emails, deps } = setup();
    await handleRazorpayWebhook(body('order_X', 32538), 'good', deps);
    const r2 = await handleRazorpayWebhook(body('order_X', 32538), 'good', deps);
    expect(r2.message).toBe('already processed');
    expect(order.status).toBe('paid');
    expect(emails).toEqual(['PG-T']);
  });

  it('rejects an amount mismatch even with a valid signature', async () => {
    const { order, emails, deps } = setup();
    const r = await handleRazorpayWebhook(body('order_X', 100), 'good', deps);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(order.status).toBe('pending');
    expect(emails).toHaveLength(0);
  });
});
