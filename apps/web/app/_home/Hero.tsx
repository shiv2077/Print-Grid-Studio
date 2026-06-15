import Link from 'next/link';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { ExtruderDiagram } from '@/components/illustrations/ExtruderDiagram';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <Section bg="paper" gridPaper>
      <Container>
        <div className={styles.layout}>
          <div className={styles.copy}>
            <p className={`h-eyebrow ${styles.eyebrow}`}>
              PRINTGRID STUDIO · CHENNAI
            </p>
            <h1 className={`display ${styles.headline}`}>
              Custom 3D printing.
              <br />
              Print-grade parts.
            </h1>
            <p className={`lede ${styles.lede}`}>
              A small Chennai studio printing real parts on Bambu P1S
              printers. Quote in seconds. In your hands in 4 days, anywhere
              in India.
            </p>
            <div className={styles.actions}>
              <Link href="/quote" className={styles.ctaPrimary}>
                Get a quote →
              </Link>
              <Link href="/materials" className={styles.ctaSecondary}>
                See materials
              </Link>
            </div>
          </div>
          <ExtruderDiagram className={styles.diagram} />
        </div>
      </Container>
    </Section>
  );
}
