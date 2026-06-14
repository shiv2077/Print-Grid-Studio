import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { IndiaMap } from '@/components/illustrations/IndiaMap';
import styles from './Shipping.module.css';

const SHIP_SPECS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'STANDARD', value: '4 working days' },
  { label: 'COURIER', value: 'Delhivery / Bluedart' },
  { label: 'TRACKING', value: 'Same-day after dispatch' },
  { label: 'INSURANCE', value: 'Above ₹2,500 included' },
  { label: 'SHIPPING', value: '₹120 · free above ₹2,500' },
];

export function Shipping() {
  return (
    <Section bg="paper-warm">
      <Container>
        <div className={styles.layout}>
          <IndiaMap className={styles.diagram} />
          <div className={styles.copy}>
            <p className="h-eyebrow">SECTION 05 · SHIPPING</p>
            <h2 className={`display-2 ${styles.heading}`}>
              Chennai to your door in four days.
            </h2>
            <p className={`lede ${styles.body}`}>
              We ship pan-India via tracked courier. Most orders dispatch
              within 24 hours of QC. The full Tier-1 city loop is four
              days; remote pincodes can take a day or two longer — we'll
              flag it before you pay.
            </p>
            <ul className={styles.specList}>
              {SHIP_SPECS.map((s) => (
                <li key={s.label} className={styles.specRow}>
                  <span className={styles.specLabel}>{s.label}</span>
                  <span className={styles.specValue}>{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
