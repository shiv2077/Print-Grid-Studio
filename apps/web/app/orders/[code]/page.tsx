import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { formatINR, MATERIALS } from '@printgrid/pricing';
import {
  getMockOrder,
  MOCK_ORDER_CODES,
  type MockOrder,
  type OrderStatus,
} from '@/lib/mock-orders';
import { LookupForm } from './LookupForm';
import styles from './order.module.css';

interface PageProps {
  params: { code: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  return {
    title: `Order ${params.code}`,
    description: `Order tracking for ${params.code} on PrintGrid Studio.`,
  };
}

const TIMELINE_ORDER: ReadonlyArray<OrderStatus> = [
  'PENDING',
  'PAID',
  'PRINTING',
  'QUALITY_CHECK',
  'SHIPPED',
  'DELIVERED',
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Quote pending',
  PAID: 'Payment received',
  PRINTING: 'Printing',
  QUALITY_CHECK: 'Quality check',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_PILL_CLASS: Record<OrderStatus, string | undefined> = {
  PENDING: styles.pillPending,
  PAID: styles.pillPaid,
  PRINTING: styles.pillPrinting,
  QUALITY_CHECK: styles.pillQc,
  SHIPPED: styles.pillShipped,
  DELIVERED: styles.pillDelivered,
  CANCELLED: styles.pillCancelled,
};

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function OrderPage({ params }: PageProps) {
  const code = params.code.toUpperCase();
  const order = getMockOrder(code);

  if (!order) {
    return (
      <Section bg="paper" gridPaper>
        <Container>
          <div className={styles.invalidWrapper}>
            <p className="h-eyebrow">ORDER NOT FOUND</p>
            <h1 className={`display-2 ${styles.invalidHeading}`}>
              {params.code === code
                ? 'No order matches that code.'
                : 'Order codes look like PG-XXXX-XXXX.'}
            </h1>
            <p className={styles.invalidBody}>
              Try the lookup below or paste the magic-link from your
              confirmation email.
            </p>
            <LookupForm />
            <p className={`micro ${styles.demoCodesLabel}`}>
              Demo codes for tonight&apos;s build:
            </p>
            <div className={styles.demoCodes}>
              {MOCK_ORDER_CODES.map((c) => (
                <Link key={c} href={`/orders/${c}`} className={styles.demoCode}>
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  return <OrderView order={order} />;
}

function OrderView({ order }: { order: MockOrder }) {
  const whatsappHref = `https://wa.me/917540023670?text=${encodeURIComponent(
    `Hi — I'd like to update something on order ${order.code}.`
  )}`;

  return (
    <Section bg="paper" gridPaper>
      <Container>
        <div className={styles.intro}>
          <div>
            <p className={`h-eyebrow ${styles.eyebrow}`}>
              ORDER · {STATUS_LABEL[order.status].toUpperCase()}
            </p>
            <p className={styles.code}>{order.code}</p>
            <p className={styles.placedAt}>
              Placed {formatDate(order.placedAt)} · {order.customerEmail}
            </p>
          </div>
          <span
            className={`${styles.statusPill} ${STATUS_PILL_CLASS[order.status]}`}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>

        <div className={styles.grid}>
          <div>
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>Status timeline</h2>
              <Timeline order={order} />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>Items</h2>
              <ul className={styles.itemList}>
                {order.items.map((item, i) => (
                  <li key={i} className={styles.item}>
                    <div className={styles.itemMain}>
                      <p className={styles.itemName}>{item.fileName}</p>
                      <p className={styles.itemSpec}>
                        {MATERIALS[item.materialKey].name} ·{' '}
                        {item.layerHeight} mm · {item.finish}
                        {item.multicolor ? ' · multicolour' : ''} · qty{' '}
                        {item.qty} · est. {item.massGrams.toFixed(1)} g
                      </p>
                    </div>
                    <span className={styles.itemSubtotal}>
                      {formatINR(item.lineSubtotalPaise)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {order.trackingNumber && (
              <section className={styles.section}>
                <h2 className={styles.sectionHeading}>Tracking</h2>
                <div className={styles.tracking}>
                  <span className={styles.trackingNumber}>
                    {order.trackingNumber}
                  </span>
                  <p className={styles.addressMeta}>
                    Courier · {order.courier}
                  </p>
                </div>
              </section>
            )}
          </div>

          <aside>
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>Breakdown</h2>
              <div className={styles.breakdown}>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Parts subtotal</span>
                  <span className={styles.breakdownValue}>
                    {formatINR(order.partsSubtotalPaise)}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Setup</span>
                  <span className={styles.breakdownValue}>
                    +{formatINR(order.setupTotalPaise)}
                  </span>
                </div>
                {order.rushFeePaise > 0 && (
                  <div className={styles.breakdownRow}>
                    <span className={styles.breakdownLabel}>Rush · +25%</span>
                    <span className={styles.breakdownValue}>
                      +{formatINR(order.rushFeePaise)}
                    </span>
                  </div>
                )}
                {order.appliedPromo && order.promoDiscountPaise > 0 && (
                  <div className={`${styles.breakdownRow} ${styles.breakdownDiscount}`}>
                    <span className={styles.breakdownLabel}>
                      Promo · {order.appliedPromo}
                    </span>
                    <span className={styles.breakdownValue}>
                      −{formatINR(order.promoDiscountPaise)}
                    </span>
                  </div>
                )}
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>Shipping</span>
                  <span className={styles.breakdownValue}>
                    {order.shippingPaise === 0
                      ? 'Free'
                      : `+${formatINR(order.shippingPaise)}`}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>
                    Payment processing 2%
                  </span>
                  <span className={styles.breakdownValue}>
                    +{formatINR(order.paymentFeePaise)}
                  </span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>
                    Tax · {order.address.state === 'Tamil Nadu'
                      ? 'CGST 9% + SGST 9%'
                      : 'IGST 18%'}
                  </span>
                  <span className={styles.breakdownValue}>
                    incl. {formatINR(order.taxPaise)}
                  </span>
                </div>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Grand total</span>
                  <span className={styles.totalValue}>
                    {formatINR(order.grandTotalPaise)}
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>Shipping address</h2>
              <p className={styles.addressBlock}>
                {[
                  order.address.name,
                  order.address.line1,
                  order.address.line2,
                  `${order.address.city}, ${order.address.state} ${order.address.pincode}`,
                ]
                  .filter(Boolean)
                  .join('\n')}
              </p>
              <p className={styles.addressMeta}>{order.address.phone}</p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>Need to update something?</h2>
              <p className={styles.addressBlock}>
                WhatsApp is the fastest way to reach the studio. The
                message will already include your order code.
              </p>
              <a
                className={styles.updateCta}
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open WhatsApp →
              </a>
            </section>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

function Timeline({ order }: { order: MockOrder }) {
  // Cancelled is special — show the cancellation as the final node and
  // treat any prior events as past.
  if (order.status === 'CANCELLED') {
    return (
      <ul className={styles.timeline}>
        {order.events.map((ev, i) => (
          <li
            key={i}
            className={`${styles.timelineRow} ${styles.timelineRowPast}`}
          >
            <span className={styles.timelineDot}>
              <span className={styles.timelineDotInner} />
            </span>
            <div>
              <p className={styles.timelineLabel}>
                {STATUS_LABEL[ev.status]}
              </p>
              <p className={styles.timelineMeta}>
                {formatDateTime(ev.at)}
                {ev.note ? ` · ${ev.note}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const eventByStatus = new Map<OrderStatus, (typeof order.events)[number]>();
  for (const ev of order.events) {
    if (!eventByStatus.has(ev.status)) eventByStatus.set(ev.status, ev);
  }

  const currentIdx = TIMELINE_ORDER.indexOf(order.status);

  return (
    <ul className={styles.timeline}>
      {TIMELINE_ORDER.map((step, i) => {
        const ev = eventByStatus.get(step);
        const isCurrent = i === currentIdx;
        const isPast = i < currentIdx;
        const isFuture = i > currentIdx;
        const rowClass = isCurrent
          ? styles.timelineRowCurrent
          : isPast
          ? styles.timelineRowPast
          : styles.timelineRowFuture;
        return (
          <li key={step} className={`${styles.timelineRow} ${rowClass}`}>
            <span className={styles.timelineDot}>
              <span className={styles.timelineDotInner} />
            </span>
            <div>
              <p className={styles.timelineLabel}>{STATUS_LABEL[step]}</p>
              {ev ? (
                <p className={styles.timelineMeta}>
                  {formatDateTime(ev.at)}
                  {ev.note ? ` · ${ev.note}` : ''}
                </p>
              ) : isFuture ? (
                <p className={styles.timelineMeta}>—</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
