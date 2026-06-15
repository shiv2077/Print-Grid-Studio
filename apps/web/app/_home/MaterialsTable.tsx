import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { MATERIALS, formatINR } from '@printgrid/pricing';
import styles from './MaterialsTable.module.css';

const MATERIAL_NOTES: Record<keyof typeof MATERIALS, string> = {
  'pla-plus': 'Default. Strong, easy to print. Good for prototypes and indoor parts.',
  'pla-lw': 'Lightweight foaming PLA. Ideal for drone bodies and props.',
  'petg': 'Tougher than PLA. Outdoor, food-adjacent, mild chemical resistance.',
  'abs': 'Heat resistant up to 95°C. Industrial enclosures and jigs.',
  'tpu-95a': 'Flexible. Gaskets, grips, vibration dampers.',
  'pa6': 'Engineering nylon. High tensile, gear-grade.',
  'pa-cf': 'Carbon-fibre nylon. Stiff, strong, expensive. End-use parts.',
};

export function MaterialsTable() {
  const rows = (Object.keys(MATERIALS) as Array<keyof typeof MATERIALS>).map(
    (key) => {
      const m = MATERIALS[key];
      return { key, ...m, note: MATERIAL_NOTES[key] };
    }
  );

  return (
    <Section bg="paper">
      <Container>
        <div className={styles.heading}>
          <p className="h-eyebrow">SECTION 02 · MATERIALS</p>
          <h2 className={`display-2 ${styles.headingTitle}`}>
            Seven materials. Real numbers.
          </h2>
          <p className={`lede ${styles.headingLede}`}>
            Density, max temperature, tensile strength — sourced from the
            filament manufacturers' datasheets. We don't inflate the spec.
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Material</th>
                <th>₹/g</th>
                <th>Density (g/cm³)</th>
                <th>Max temp</th>
                <th>Tensile (MPa)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>
                    <span className={styles.materialName}>{r.name}</span>
                  </td>
                  <td className={styles.spec}>
                    {formatINR(r.ratePerGramPaise)}
                  </td>
                  <td className={styles.spec}>{r.density.toFixed(2)}</td>
                  <td className={styles.spec}>{r.maxTempC}°C</td>
                  <td className={styles.spec}>{r.tensileMpa}</td>
                  <td className={styles.note}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </Section>
  );
}
