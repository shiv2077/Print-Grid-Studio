import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import styles from './FinalCta.module.css';

export function FinalCta() {
  return (
    <Section bg="ink">
      <Container>
        <div className={styles.layout}>
          <p className={`h-eyebrow ${styles.eyebrow}`}>READY WHEN YOU ARE</p>
          <h2 className={`display ${styles.headline}`}>
            Drop a file. See a price.
          </h2>
          <p className={`lede ${styles.lede}`}>
            No account, no upload-before-quote, no waiting for a sales
            email. The number you see is the number you pay.
          </p>
          <div className={styles.actions}>
            <Link href="/quote" className={styles.ctaPrimary}>
              Get a quote →
            </Link>
            <Link href="/contact" className={styles.ctaSecondary}>
              Talk to us
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
