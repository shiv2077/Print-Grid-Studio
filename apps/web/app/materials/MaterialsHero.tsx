import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import styles from './MaterialsHero.module.css';

export function MaterialsHero() {
  return (
    <Section bg="paper" gridPaper>
      <Container>
        <p className={`h-eyebrow ${styles.eyebrow}`}>
          PRINTGRID STUDIO · STOCK
        </p>
        <h1 className={`display ${styles.headline}`}>Materials.</h1>
        <p className={`lede ${styles.lede}`}>
          We stock seven filaments, mostly Bambu and Polymaker. Numbers
          below come from the manufacturers' datasheets — we don't
          inflate. If your part needs a material we don't list, ask: we
          can run a small batch on request.
        </p>
      </Container>
    </Section>
  );
}
