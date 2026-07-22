// apps/web/app/orders/[code]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { formatINR } from '@printgrid/pricing';
import { getOrderStatus, type OrderStatus } from '@/lib/checkout';
import { FULFILLMENT_STATUSES, STATUS_LABELS, type FulfillmentStatus } from '@/lib/fulfillment-status';
import styles from './page.module.css';

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
  const reduceMotion = useReducedMotion();
  const current = (order.fulfillment_status ?? 'uploaded') as FulfillmentStatus;
  const currentIdx = Math.max(0, FULFILLMENT_STATUSES.indexOf(current));
  // last event per status
  const byStatus = new Map<string, { at: string; note: string | null }>();
  for (const h of order.history ?? []) byStatus.set(h.status, { at: h.at, note: h.note });

  return (
    <div className={styles.timeline} role="list" aria-label="Order progress">
      {FULFILLMENT_STATUSES.map((s, i) => {
        const ev = s === 'uploaded' ? { at: order.created_at ?? null, note: null } : byStatus.get(s) ?? null;
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const isLast = i === FULFILLMENT_STATUSES.length - 1;
        return (
          <div key={s} role="listitem" className={styles.row}>
            {!isLast && (
              <motion.span
                className={done ? `${styles.connector} ${styles.connectorDone}` : styles.connector}
                initial={reduceMotion ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: 'top' }}
              />
            )}
            <span className={styles.dotWrap}>
              <span className={done ? `${styles.dot} ${styles.dotDone}` : styles.dot} />
              {isCurrent && !reduceMotion && (
                <motion.span
                  className={styles.dotPulse}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </span>
            <div className={styles.body}>
              <span className={done ? `${styles.label} ${styles.labelDone}` : styles.label}>
                {STATUS_LABELS[s]}
                {isCurrent && <span className={styles.currentTag}> · current</span>}
              </span>
              {ev?.at && <span className={`${styles.time} ${styles.mono}`}>{fmt(ev.at)}</span>}
              {ev?.note && <span className={styles.note}>{ev.note}</span>}
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
      <section className={styles.head}>
        <div className="wrap">
          <div className={styles.eyebrow}>Order</div>
          <h1 className={styles.title}>{code}</h1>
          <p className={styles.lede}>Track the status of your PrintGrid Studio order.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="wrap">
          {state === 'loading' && <p className={styles.loading} role="status">Loading…</p>}

          {state === 'error' && (
            <div className={styles.card} role="alert">
              <h2 className={styles.cardTitle}>Couldn&rsquo;t load this order.</h2>
              <p className={styles.mutedText}>Something went wrong reaching the server. Please try again in a moment.</p>
            </div>
          )}

          {state === 'notfound' && (
            <div className={styles.card} role="alert">
              <h2 className={styles.cardTitle}>No order matches that code.</h2>
              <p className={styles.mutedText}>
                Order codes look like <span className={styles.mono}>PG-XXXXXXXX</span>. Check the link in your
                confirmation email, or reach us on WhatsApp.
              </p>
              <a className={styles.linkGhost} href="https://wa.me/917540023670" target="_blank" rel="noopener noreferrer">
                Open WhatsApp →
              </a>
            </div>
          )}

          {state === 'found' && order && (
            <div className={styles.card}>
              <span className={order.status === 'paid' ? `${styles.status} ${styles.statusPaid}` : styles.status}>
                {PAYMENT_LABEL[order.status] ?? order.status}
              </span>
              <div className={styles.totalHeadline}>{formatINR(order.amount_paise)}</div>
              <div className={styles.totalCaption}>Order total · incl. GST</div>

              {order.status === 'pending' && (
                <p className={styles.mutedText}>
                  We&rsquo;re waiting for payment confirmation. This page updates once your payment is verified.
                </p>
              )}

              {order.status === 'paid' && (
                <>
                  <h2 className={styles.timelineHeading}>Progress</h2>
                  <Timeline order={order} />
                </>
              )}

              <a
                className={styles.linkGhost}
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
