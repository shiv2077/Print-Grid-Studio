import { describe, expect, it, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { WebhookService } from '../src/webhook/webhook.service';
import { RazorpayService } from '../src/razorpay/razorpay.service';

const SECRET = 'whsec_test_abc123';

function makeRazorpay() {
  const fakeConfig = {
    getOrThrow: (k: string) => ({ RAZORPAY_KEY_ID: 'rzp_test_x', RAZORPAY_KEY_SECRET: 'secret_x' }[k]),
    get: (k: string) => ({ RAZORPAY_WEBHOOK_SECRET: SECRET }[k]),
  } as any;
  return new RazorpayService(fakeConfig);
}

// In-memory order with the real pending->paid-once semantics.
function makeRepo() {
  const order: any = {
    id: 'uuid-1',
    orderCode: 'PG-TEST01',
    amountPaise: 32538,
    status: 'pending',
    razorpayOrderId: 'order_LIVE1',
    razorpayPaymentId: null,
    email: 'buyer@example.com',
  };
  return {
    order,
    async findByRazorpayOrderId(id: string) {
      return id === order.razorpayOrderId ? order : null;
    },
    async markPaidIfPending(id: string, paymentId: string) {
      if (id === order.razorpayOrderId && order.status === 'pending') {
        order.status = 'paid';
        order.razorpayPaymentId = paymentId;
        return order;
      }
      return null;
    },
  };
}

function makeEmail() {
  return { calls: [] as string[], async sendOrderConfirmation(o: any) { this.calls.push(o.orderCode); return { sent: true }; } };
}

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

function capturedEvent(orderId: string, amount: number) {
  return JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_1', order_id: orderId, amount, status: 'captured' } } },
  });
}

describe('WebhookService (Razorpay security boundary)', () => {
  let svc: WebhookService;
  let repo: ReturnType<typeof makeRepo>;
  let email: ReturnType<typeof makeEmail>;

  beforeEach(() => {
    repo = makeRepo();
    email = makeEmail();
    svc = new WebhookService(makeRazorpay(), repo as any, email as any);
  });

  it('rejects a forged/invalid signature and changes nothing', async () => {
    const body = capturedEvent('order_LIVE1', 32538);
    const out = await svc.handle(Buffer.from(body), 'deadbeef-not-a-real-signature');
    expect(out.ok).toBe(false);
    expect(out.status).toBe(400);
    expect(repo.order.status).toBe('pending');
    expect(email.calls).toHaveLength(0);
  });

  it('flips pending -> paid on a valid signature and sends one email', async () => {
    const body = capturedEvent('order_LIVE1', 32538);
    const out = await svc.handle(Buffer.from(body), sign(body));
    expect(out.ok).toBe(true);
    expect(out.status).toBe(200);
    expect(repo.order.status).toBe('paid');
    expect(repo.order.razorpayPaymentId).toBe('pay_1');
    expect(email.calls).toEqual(['PG-TEST01']);
  });

  it('is idempotent: the same valid event twice flips once, emails once', async () => {
    const body = capturedEvent('order_LIVE1', 32538);
    const first = await svc.handle(Buffer.from(body), sign(body));
    const second = await svc.handle(Buffer.from(body), sign(body));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(repo.order.status).toBe('paid');
    expect(email.calls).toEqual(['PG-TEST01']); // exactly once
  });

  it('rejects an amount mismatch even with a valid signature', async () => {
    const body = capturedEvent('order_LIVE1', 100); // tampered amount
    const out = await svc.handle(Buffer.from(body), sign(body));
    expect(out.ok).toBe(false);
    expect(out.status).toBe(400);
    expect(repo.order.status).toBe('pending');
    expect(email.calls).toHaveLength(0);
  });
});
