import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { formatINR, MATERIALS, type MaterialKey } from '@/lib/pricing';
import styles from './MaterialSection.module.css';

export interface MaterialSectionProps {
  materialKey: MaterialKey;
  index: number;
  body: string;
  /** Recommended layer-height range, e.g. "0.16 – 0.20 mm" */
  layerRange: string;
  /** Recommended wall count, e.g. "3" or "3 – 4" */
  walls: string;
  /** "RECOMMENDED FOR" text — short application list */
  recommendedFor: string;
  /** Title-block code for the photo placeholder, e.g. "PG-MAT-PLA+" */
  titleBlock: string;
}

export function MaterialSection({
  materialKey,
  index,
  body,
  layerRange,
  walls,
  recommendedFor,
  titleBlock,
}: MaterialSectionProps) {
  const m = MATERIALS[materialKey];
  const bg = index % 2 === 0 ? 'paper' : 'paper-warm';

  return (
    <Section bg={bg} id={materialKey}>
      <Container>
        <div className={styles.layout}>
          <div className={styles.copy}>
            <p className={`h-eyebrow ${styles.eyebrow}`}>
              MATERIAL · {String(index + 1).padStart(2, '0')} OF 07
            </p>
            <h2 className={`display-2 ${styles.heading}`}>{m.name}</h2>
            <p className={styles.body}>{body}</p>
            <ul className={styles.specList}>
              <li className={styles.specRow}>
                <span className={styles.specLabel}>Rate</span>
                <span className={styles.specValue}>
                  {formatINR(m.ratePerGramPaise)} / g
                </span>
              </li>
              <li className={styles.specRow}>
                <span className={styles.specLabel}>Density</span>
                <span className={styles.specValue}>
                  {m.density.toFixed(2)} g/cm³
                </span>
              </li>
              <li className={styles.specRow}>
                <span className={styles.specLabel}>Max temp</span>
                <span className={styles.specValue}>{m.maxTempC}°C</span>
              </li>
              <li className={styles.specRow}>
                <span className={styles.specLabel}>Tensile</span>
                <span className={styles.specValue}>{m.tensileMpa} MPa</span>
              </li>
              <li className={styles.specRow}>
                <span className={styles.specLabel}>Layer range</span>
                <span className={styles.specValue}>{layerRange}</span>
              </li>
              <li className={styles.specRow}>
                <span className={styles.specLabel}>Walls</span>
                <span className={styles.specValue}>{walls}</span>
              </li>
              <li className={styles.specRow}>
                <span className={styles.specLabel}>Use for</span>
                <span className={styles.specValue}>{recommendedFor}</span>
              </li>
            </ul>
          </div>

          <div className={styles.photoPlaceholder} aria-hidden>
            <div className={styles.photoTitleBlock}>
              <span>{titleBlock}</span>
              <span>PHOTO · TBD</span>
            </div>
            <div className={styles.photoBody}>
              <span className={styles.photoLabel}>{m.name}</span>
              <span className={styles.photoNote}>
                Real product photo lands before launch.
              </span>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
