import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    n: '01',
    title: 'Upload',
    body: 'Drop an STL. We parse it in your browser to estimate weight and bounds — no upload to a server until you place the order.',
  },
  {
    n: '02',
    title: 'Quote',
    body: 'Pick material, layer height, finish, and quantity. The number updates as you click. No surprise fees at checkout.',
  },
  {
    n: '03',
    title: 'Print',
    body: 'Approved quote enters the queue. Bambu P1S printers, AMS multicolour when you need it, single-piece up to 256×256×256 mm.',
  },
  {
    n: '04',
    title: 'Ship',
    body: 'Pan-India in 4 days via tracked courier. Free shipping above ₹2,500. Insured for damaged-on-arrival.',
  },
] as const;

export function HowItWorks() {
  return (
    <Section bg="paper-warm" id="how-it-works">
      <Container>
        <div className={styles.heading}>
          <p className="h-eyebrow">SECTION 01 · HOW IT WORKS</p>
          <h2 className={`display-2 ${styles.headingTitle}`}>
            Four steps from STL to delivered part.
          </h2>
        </div>
        <div className={styles.grid}>
          {STEPS.map((s) => (
            <article key={s.n} className={styles.card}>
              <p className={styles.step}>{s.n}</p>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.body}>{s.body}</p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
