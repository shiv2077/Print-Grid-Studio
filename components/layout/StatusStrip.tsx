import { Container } from '@/components/ui/Container';
import styles from './StatusStrip.module.css';

const STATUS_TEXT =
  'CHENNAI · HYDERABAD LATE JUNE 2026 · SHIPS PAN-INDIA IN 4 DAYS';

export function StatusStrip() {
  return (
    <aside className={styles.strip} aria-label="Studio status">
      <Container>
        <p className={`mono-label ${styles.text}`}>{STATUS_TEXT}</p>
      </Container>
    </aside>
  );
}
