import type { ReactNode } from 'react';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import styles from './legal.module.css';

export interface LegalPageProps {
  eyebrow: string;
  heading: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPage({
  eyebrow,
  heading,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <Section bg="paper" gridPaper>
      <Container>
        <div className={styles.column}>
          <p className={`h-eyebrow ${styles.eyebrow}`}>{eyebrow}</p>
          <h1 className={`display-2 ${styles.heading}`}>{heading}</h1>
          <p className={styles.lastUpdated}>Last updated · {lastUpdated}</p>
          {children}
        </div>
      </Container>
    </Section>
  );
}

export const legalStyles = styles;
