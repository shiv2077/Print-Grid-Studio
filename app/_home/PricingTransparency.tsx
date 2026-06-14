import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { formatINR, MATERIALS, quote } from '@/lib/pricing';
import styles from './PricingTransparency.module.css';

/* Worked example. Numbers come from quote() so they stay in sync if
   constants in lib/pricing.ts ever change. The example: 50g PLA+ part,
   0.20mm layer, as-printed, single quantity, no rush, no promo,
   shipping under threshold (so customer sees the line). */
const EXAMPLE = {
  massGrams: 50,
  materialKey: 'pla-plus',
  layerHeight: '0.20',
  finish: 'as-printed',
  multicolor: false,
  qty: 1,
} as const;

export function PricingTransparency() {
  const result = quote({ files: [EXAMPLE] });
  const item = result.lineItems[0];
  if (!item) throw new Error('Pricing example failed to compute');
  const material = MATERIALS[EXAMPLE.materialKey];

  return (
    <Section bg="paper" id="pricing">
      <Container>
        <div className={styles.heading}>
          <p className="h-eyebrow">SECTION 04 · PRICING</p>
          <h2 className={`display-2 ${styles.headingTitle}`}>
            Honest math. No hidden fees.
          </h2>
        </div>

        <div className={styles.layout}>
          <div>
            <p className={styles.intro}>
              Here is how a quote actually adds up. A small {EXAMPLE.massGrams}-gram
              {' '}part in {material.name}, single quantity, as-printed
              finish, default {EXAMPLE.layerHeight}-mm layer height. Every
              line is a real fee from the engine that runs on the quote
              page.
            </p>
            <p className={styles.intro}>
              No engineering discount. No "founder's club" tiers visible
              only after you log in. The same calculator runs whether
              you're a hobby builder ordering one bracket or a drone
              startup ordering fifty.
            </p>
            <p className={styles.intro}>
              Bigger orders get the standard volume discount: 5% at 10+,
              10% at 20+, 15% at 50+. Below ₹199 we top up to ₹199 because
              setup time on a small job is the same as a medium one.
            </p>
          </div>

          <div className={styles.breakdown}>
            <div className={styles.breakdownHeader}>
              <span>EXAMPLE QUOTE</span>
              <span>{material.name.toUpperCase()} · 50G</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>
                Material · {EXAMPLE.massGrams}g × {formatINR(material.ratePerGramPaise)}/g
              </span>
              <span className={styles.value}>{formatINR(item.materialPaise)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>
                Layer multiplier · {EXAMPLE.layerHeight} mm
              </span>
              <span className={styles.value}>×1.00</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Finish · as-printed</span>
              <span className={styles.value}>+{formatINR(0)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Per unit</span>
              <span className={styles.value}>{formatINR(item.perUnitPaise)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Setup fee</span>
              <span className={styles.value}>+{formatINR(result.setupTotalPaise)}</span>
            </div>
            <div className={styles.subtotalRow}>
              <span className={styles.label}>Subtotal</span>
              <span className={styles.value}>{formatINR(result.subtotalPaise)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Min order top-up</span>
              <span className={styles.value}>+{formatINR(result.minTopUpPaise)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Shipping (under ₹2,500)</span>
              <span className={styles.value}>+{formatINR(result.shippingPaise)}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Payment processing 2%</span>
              <span className={styles.value}>+{formatINR(result.paymentFeePaise)}</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.label}>Grand total · incl. 18% GST</span>
              <span className={styles.value}>{formatINR(result.grandTotalPaise)}</span>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
