'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '@printgrid/pricing';
import { getOrderStatus, type OrderStatus } from '@/lib/checkout';
import { FULFILLMENT_STATUSES, STATUS_LABELS, type FulfillmentStatus } from '@/lib/fulfillment-status';

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function fmt(at?: string | null): string {
  if (!at) return '';
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Timeline({ order }: { order: OrderStatus }) {
  const current = (order.fulfillment_status ?? 'uploaded') as FulfillmentStatus;
  const currentIdx = Math.max(0, FULFILLMENT_STATUSES.indexOf(current));
  // last event per status
  const byStatus = new Map<string, { at: string; note: string | null }>();
  for (const h of order.history ?? []) byStatus.set(h.status, { at: h.at, note: h.note });

  return (
    <div className="timeline" role="list" aria-label="Order progress">
      {FULFILLMENT_STATUSES.map((s, i) => {
        const ev = s === 'uploaded' ? { at: order.created_at ?? null, note: null } : byStatus.get(s) ?? null;
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div
            key={s}
            role="listitem"
            className={'timeline__row' + (done ? ' is-done' : '') + (isCurrent ? ' is-current' : '')}
          >
            <span className="timeline__dot" aria-hidden />
            <div className="timeline__body">
              <span className="timeline__label">
                {STATUS_LABELS[s]}
                {isCurrent && <span className="timeline__current-tag"> · current</span>}
              </span>
              {ev?.at && <span className="timeline__time mono">{fmt(ev.at)}</span>}
              {ev?.note && <span className="timeline__note">{ev.note}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const [state, setState] = useState<'loading' | 'found' | 'notfound' | 'error'>('loading');
  const [order, setOrder] = useState<OrderStatus | null>(null);

  useEffect(() => {
    let active = true;
    getOrderStatus(code)
      .then((o) => { if (active) { setOrder(o); setState('found'); } })
      .catch((e: Error) => { if (active) setState(/not found/i.test(e.message) || /404/.test(e.message) ? 'notfound' : 'error'); });
    return () => { active = false; };
  }, [code]);

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <div className="eyebrow page-head__eyebrow">Order</div>
          <h1 className="display-2 mono">{code}</h1>
          <p className="lede">Track the status of your PrintGrid Studio order.</p>
        </div>
      </section>

      <section className="order">
        <div className="wrap">
          {state === 'loading' && <p className="mono" style={{ color: 'var(--ink-60)' }} role="status">Loading…</p>}

          {state === 'error' && (
            <div className="order-card" role="alert">
              <h2 className="display-2" style={{ fontSize: 24 }}>Couldn&rsquo;t load this order.</h2>
              <p style={{ color: 'var(--ink-60)' }}>Something went wrong reaching the server. Please try again in a moment.</p>
            </div>
          )}

          {state === 'notfound' && (
            <div className="order-card" role="alert">
              <h2 className="display-2" style={{ fontSize: 24 }}>No order matches that code.</h2>
              <p style={{ color: 'var(--ink-60)' }}>
                Order codes look like <span className="mono">PG-XXXXXXXX</span>. Check the link in your
                confirmation email, or reach us on WhatsApp.
              </p>
              <a className="btn btn-ghost" href="https://wa.me/917540023670" target="_blank" rel="noopener noreferrer">
                Open WhatsApp →
              </a>
            </div>
          )}

          {state === 'found' && order && (
            <div className="order-card">
              <span className={'order-status' + (order.status === 'paid' ? ' order-status--paid' : '')}>
                {PAYMENT_LABEL[order.status] ?? order.status}
              </span>
              <div className="quote-card__total-headline">{formatINR(order.amount_paise)}</div>
              <div className="quote-card__total-caption">Order total · incl. GST</div>

              {order.status === 'pending' && (
                <p style={{ color: 'var(--ink-60)' }}>
                  We&rsquo;re waiting for payment confirmation. This page updates once your payment is verified.
                </p>
              )}

              {order.status === 'paid' && (
                <>
                  <h2 className="timeline__heading">Progress</h2>
                  <Timeline order={order} />
                </>
              )}

              <a
                className="btn btn-ghost"
                href={`https://wa.me/917540023670?text=${encodeURIComponent(`Hi — about order ${code}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Question about this order →
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
