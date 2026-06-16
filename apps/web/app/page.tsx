import Link from 'next/link';

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
    <>
      {/* Hero */}
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow hero__eyebrow">FDM only · Chennai</div>
          <h1 className="display hero__title">FDM 3D printing. Quoted live. Printed locally.</h1>
          <p className="lede hero__lede">
            Upload an STL, pick a material, and see a real price computed from the actual mesh in
            under a minute. Pay over UPI. Ships pan-India in four days.
          </p>
          <div className="hero__actions">
            <Link className="btn btn-primary" href="/quote">
              Upload STL · See live price
            </Link>
            <Link className="btn btn-ghost" href="/materials">
              Browse materials
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section section--warm">
        <div className="wrap">
          <div className="section__head">
            <div className="eyebrow section__eyebrow">How it works</div>
            <h2 className="display-2 section__title">Three steps. No back-and-forth.</h2>
            <p className="lede">
              The quote you see is the price you pay. The mesh is measured, not estimated.
            </p>
          </div>
          <div className="feature-grid">
            {STEPS.map((s) => (
              <div className="feature" key={s.num}>
                <span className="feature__num">{s.num}</span>
                <h3 className="feature__title">{s.title}</h3>
                <p className="feature__body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materials teaser */}
      <section className="section">
        <div className="wrap">
          <div className="section__head">
            <div className="eyebrow section__eyebrow">Materials</div>
            <h2 className="display-2 section__title">Seven FDM materials, kept in stock.</h2>
            <p className="lede">
              PLA+, PLA LW, PETG, ABS, TPU 95A, PA6 and PA-CF — from everyday brackets to
              engineering-grade carbon-filled nylon. No “available on request”.
            </p>
          </div>
          <Link className="btn btn-ghost" href="/materials">
            See materials &amp; specs →
          </Link>
        </div>
      </section>

      {/* Pricing transparency */}
      <section id="pricing" className="section section--warm">
        <div className="wrap">
          <div className="section__head">
            <div className="eyebrow section__eyebrow">Pricing</div>
            <h2 className="display-2 section__title">Every rupee, on the table.</h2>
            <p className="lede">
              No hidden fees. Here is exactly what goes into the number you pay.
            </p>
          </div>
          <div className="rowlist">
            {PRICING_ROWS.map((r) => (
              <div className="rowlist__row" key={r.label}>
                <span className="rowlist__label">{r.label}</span>
                <span className="rowlist__value">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section--ink cta-band">
        <div className="wrap">
          <h2 className="display-2 cta-band__title">Got an STL? Get a price right now.</h2>
          <p className="lede cta-band__lede">
            Drop your file, see the number, and pay over UPI. Printed in Chennai, shipped pan-India
            in four days.
          </p>
          <Link className="btn btn-primary" href="/quote">
            Upload STL · See live price
          </Link>
        </div>
      </section>
    </>
  );
}
