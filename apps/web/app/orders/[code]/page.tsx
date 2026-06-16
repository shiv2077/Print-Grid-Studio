'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '@printgrid/pricing';
import { getOrderStatus, type OrderStatus } from '@/lib/checkout';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export default function OrderPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const [state, setState] = useState<'loading' | 'found' | 'notfound'>('loading');
  const [order, setOrder] = useState<OrderStatus | null>(null);

  useEffect(() => {
    let active = true;
    getOrderStatus(code)
      .then((o) => { if (active) { setOrder(o); setState('found'); } })
      .catch(() => { if (active) setState('notfound'); });
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
          {state === 'loading' && <p className="mono" style={{ color: 'var(--ink-60)' }}>Loading…</p>}

          {state === 'notfound' && (
            <div className="order-card">
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
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
              <div className="quote-card__total-headline">{formatINR(order.amount_paise)}</div>
              <div className="quote-card__total-caption">Order total · incl. GST</div>
              {order.status === 'pending' && (
                <p style={{ color: 'var(--ink-60)' }}>
                  We&rsquo;re waiting for payment confirmation. This page updates once your payment is
                  verified — no need to refresh repeatedly.
                </p>
              )}
              {order.status === 'paid' && (
                <p style={{ color: 'var(--ink-60)' }}>
                  Payment confirmed. We&rsquo;ll email you tracking once your print ships.
                </p>
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
