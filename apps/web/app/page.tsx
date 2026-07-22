import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';
import styles from './page.module.css';

const STEPS = [
  {
    num: '01',
    title: 'Upload your STL',
    body: 'Drop an STL in the browser. We parse the actual mesh — volume, bounding box, triangle count — right on your device. Nothing is uploaded until you order.',
  },
  {
    num: '02',
    title: 'See a real price',
    body: 'Pick a material, layer height and finish. The price is computed from your model’s true volume — no “contact us for a quote”, no guessing. Including 18% GST and the payment fee.',
  },
  {
    num: '03',
    title: 'Pay and we print',
    body: 'Pay over UPI through Razorpay. We print on calibrated FDM machines in Chennai and ship pan-India in four days, with tracking on every order.',
  },
];

const PRICING_ROWS = [
  { label: 'Material', value: 'Per-gram rate × printed mass' },
  { label: 'Setup fee', value: '₹100 / file' },
  { label: 'Rush turnaround', value: '+25% (optional)' },
  { label: 'GST', value: '18%' },
  { label: 'Shipping', value: '₹120 · free over ₹2,500' },
  { label: 'Payment processing', value: '2%' },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="wrap">
          <Reveal>
            <div className={styles.eyebrow}>FDM only · Chennai</div>
            <h1 className={styles.title}>FDM 3D printing. Quoted live. Printed locally.</h1>
            <p className={styles.lede}>
              Upload an STL, pick a material, and see a real price computed from the actual mesh in
              under a minute. Pay over UPI. Ships pan-India in four days.
            </p>
            <div className={styles.actions}>
              <Link className={styles.btnPrimary} href="/quote">
                Upload STL · See live price
              </Link>
              <Link className={styles.btnGhost} href="/materials">
                Browse materials
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={styles.section}>
        <div className="wrap">
          <Reveal className={styles.sectionHead}>
            <div className={styles.eyebrow}>How it works</div>
            <h2 className={styles.sectionTitle}>Three steps. No back-and-forth.</h2>
            <p className={styles.lede}>
              The quote you see is the price you pay. The mesh is measured, not estimated.
            </p>
          </Reveal>
          <div className={styles.stepGrid}>
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.1}>
                <Card>
                  <span className={styles.stepNum}>{s.num}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepBody}>{s.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Materials teaser */}
      <section className={styles.section}>
        <div className="wrap">
          <Reveal className={styles.sectionHead}>
            <div className={styles.eyebrow}>Materials</div>
            <h2 className={styles.sectionTitle}>Seven FDM materials, kept in stock.</h2>
            <p className={styles.lede}>
              PLA+, PLA LW, PETG, ABS, TPU 95A, PA6 and PA-CF — from everyday brackets to
              engineering-grade carbon-filled nylon. No “available on request”.
            </p>
            <Link className={styles.btnGhost} href="/materials">
              See materials &amp; specs →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Pricing transparency */}
      <section id="pricing" className={styles.section}>
        <div className="wrap">
          <Reveal className={styles.sectionHead}>
            <div className={styles.eyebrow}>Pricing</div>
            <h2 className={styles.sectionTitle}>Every rupee, on the table.</h2>
            <p className={styles.lede}>No hidden fees. Here is exactly what goes into the number you pay.</p>
          </Reveal>
          <Reveal className={styles.rowlist}>
            {PRICING_ROWS.map((r) => (
              <div className={styles.rowlistRow} key={r.label}>
                <span className={styles.rowlistLabel}>{r.label}</span>
                <span className={styles.rowlistValue}>{r.value}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.ctaBand}>
        <div className="wrap">
          <Reveal>
            <h2 className={styles.ctaTitle}>Got an STL? Get a price right now.</h2>
            <p className={styles.ctaLede}>
              Drop your file, see the number, and pay over UPI. Printed in Chennai, shipped pan-India
              in four days.
            </p>
            <Link className={styles.btnPrimary} href="/quote">
              Upload STL · See live price
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
