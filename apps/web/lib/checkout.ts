// Client checkout helpers. Same-origin /api/* routes (one Vercel deploy).
// The browser NEVER computes or trusts the price, and NEVER marks an order
// paid — it submits the files, opens Razorpay with the server-issued order id,
// then POLLS the server (which only flips to `paid` after a verified webhook).
import type { FileRowConfig } from '@/app/quote/state';
import type { ShippingAddress } from '@/lib/address';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export interface CreateOrderResponse {
  order_code: string;
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
  key_id: string;
}

export interface OrderStatusHistoryEntry {
  status: string;
  note: string | null;
  at: string;
}

export interface OrderStatus {
  order_code: string;
  status: string;
  amount_paise: number;
  currency: string;
  fulfillment_status?: string;
  created_at?: string;
  history?: OrderStatusHistoryEntry[];
}

export interface OrderFileInput {
  file: File;
  config: FileRowConfig;
}

export async function createOrder(
  files: OrderFileInput[],
  opts: { rush?: boolean; promo?: string | null; address?: ShippingAddress; email?: string | null } = {},
): Promise<CreateOrderResponse> {
  const fd = new FormData();
  for (const { file } of files) fd.append('file', file, file.name);
  fd.append(
    'meta',
    JSON.stringify({
      configs: files.map((f) => f.config),
      rush: opts.rush ?? false,
      promo: opts.promo ?? null,
      email: opts.email ?? opts.address?.email ?? null,
      address: opts.address ?? null,
    }),
  );

  const res = await fetch('/api/orders', { method: 'POST', body: fd });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Order creation failed (${res.status}). ${detail}`.trim());
  }
  return (await res.json()) as CreateOrderResponse;
}

export async function getOrderStatus(code: string): Promise<OrderStatus> {
  const res = await fetch(`/api/orders/${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(`Status check failed (${res.status})`);
  return (await res.json()) as OrderStatus;
}

/** Poll until the SERVER reports `paid` (set only by the verified webhook). */
export async function pollUntilPaid(
  code: string,
  { intervalMs = 2500, timeoutMs = 120_000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<'paid' | 'timeout' | 'failed'> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const s = await getOrderStatus(code);
      if (s.status === 'paid') return 'paid';
      if (s.status === 'failed' || s.status === 'cancelled') return 'failed';
    } catch {
      // transient — keep polling
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return 'timeout';
}

const RZP_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'));
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RZP_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.src = RZP_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Razorpay failed to load'));
    document.body.appendChild(s);
  });
}

export function openCheckout(args: {
  order: CreateOrderResponse;
  email?: string | null;
  onSuccess: () => void;
  onDismiss: () => void;
}): void {
  if (!window.Razorpay) throw new Error('Razorpay not loaded');
  const rzp = new window.Razorpay({
    key: args.order.key_id,
    order_id: args.order.razorpay_order_id,
    amount: args.order.amount_paise,
    currency: args.order.currency,
    name: 'PrintGrid Studio',
    description: `Order ${args.order.order_code}`,
    prefill: args.email ? { email: args.email } : undefined,
    handler: () => args.onSuccess(),
    modal: { ondismiss: () => args.onDismiss() },
  });
  rzp.open();
}
