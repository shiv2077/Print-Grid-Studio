import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { BuildEnvelopeDiagram } from '@/components/illustrations/BuildEnvelopeDiagram';
import styles from './BuildEnvelope.module.css';

const SPECS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'BUILD VOLUME', value: '256 × 256 × 256 mm' },
  { label: 'PRINTERS', value: 'Bambu P1S × 2' },
  { label: 'NOZZLE', value: '0.4 mm hardened steel' },
  { label: 'LAYER RANGE', value: '0.12 – 0.28 mm' },
  { label: 'COLOURS', value: 'Up to 4 (AMS)' },
];

export function BuildEnvelope() {
  return (
    <Section bg="paper-warm">
      <Container>
        <div className={styles.layout}>
          <div className={styles.copy}>
            <p className="h-eyebrow">SECTION 03 · BUILD ENVELOPE</p>
            <h2 className={`display-2 ${styles.heading}`}>
              If it fits in 256 mm, it ships in one piece.
            </h2>
            <p className={`lede ${styles.body}`}>
              Two Bambu P1S printers with a 256 mm cube envelope. Anything
              that fits inside that volume gets printed without splitting.
              Larger parts need a quick chat — we'll plan the seams so the
              join lines are off the visible face.
            </p>
            <ul className={styles.specList}>
              {SPECS.map((s) => (
                <li key={s.label} className={styles.specRow}>
                  <span className={styles.specLabel}>{s.label}</span>
                  <span className={styles.specValue}>{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <BuildEnvelopeDiagram className={styles.diagram} />
        </div>
      </Container>
    </Section>
  );
}
