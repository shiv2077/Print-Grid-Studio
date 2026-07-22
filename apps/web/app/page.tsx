import Link from 'next/link';
import { Reveal } from './_components/Reveal';
import { AnimatedLogo } from './_components/AnimatedLogo';
import { HeroVideoCard } from './_components/HeroVideoCard';
import { MaterialBars } from './_components/MaterialBars';
import { STATS, FLOW, FOOTER_COLS, TRUST_BADGES, HERO_SPECS } from './_data';

export default function V2Home() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <header className="v2-section v2-hero">
        <div className="v2-liquid" aria-hidden="true">
          <span className="v2-liquid__orb v2-liquid__orb--one" />
          <span className="v2-liquid__orb v2-liquid__orb--two" />
          <span className="v2-liquid__orb v2-liquid__orb--three" />
        </div>
        <div className="v2-wrap v2-hero__grid">
          <div>
            <div className="v2-hero__intro">
              <AnimatedLogo />
              <p className="v2-eyebrow v2-hero__eyebrow">FDM 3D printing · Chennai</p>
            </div>
            <h1 className="v2-display-xl v2-hero__title">
              Make the physical<br />feel <span className="v2-accent">effortless.</span>
            </h1>
            <p className="v2-lede v2-hero__lede">
              The quote is computed from your model&rsquo;s true mesh volume — not a bounding-box
              guess, not &ldquo;contact us&rdquo;. Pay over UPI. Ships pan-India in four days.
            </p>
            <div className="v2-hero__cta">
              <Link href="/quote" className="v2-btn v2-btn--primary">Get a quote →</Link>
              <Link href="/materials" className="v2-btn v2-btn--ghost">Browse materials</Link>
            </div>
            <div className="v2-hero__specs">
              {HERO_SPECS.map((s) => (
                <span className="v2-hero__spec" key={s.label}>
                  <b>{s.value}{s.unit && <>&nbsp;{s.unit}</>}</b>
                  <span>{s.label}</span>
                </span>
              ))}
            </div>
          </div>

          <HeroVideoCard />
        </div>
      </header>
      <div id="v2-nav-sentinel" aria-hidden="true" />

      {/* ---------------- Stats ---------------- */}
      <section className="v2-section v2-section--tight" id="specs" aria-label="Studio specifications">
        <div className="v2-wrap">
          <Reveal>
            <div className="v2-stats">
              {STATS.map((s) => (
                <div className="v2-stat" key={s.tag}>
                  <span className="v2-stat__tag">{s.tag}</span>
                  <span className="v2-stat__num">{s.num}{s.unit && <small>{s.unit}</small>}</span>
                  <span className="v2-stat__label">{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Statement block #1 (value prop) ---------------- */}
      <section className="v2-statement v2-statement--split" aria-label="What makes the price honest">
        <div className="v2-wrap">
          <div className="v2-statement__inner">
            <div>
              <p className="v2-statement__eyebrow">The price is the price</p>
              <h2 className="v2-statement__title">Priced from the actual mesh. Not a guess.</h2>
            </div>
            <div>
              <p className="v2-statement__body">
                We measure the true volume of your model on the server and price it through one
                transparent formula — material, layer height, finish, 18% GST and the payment fee,
                shown line by line before you pay. The number you see is the number you pay.
              </p>
              <div className="v2-statement__cta">
                <Link href="/quote" className="v2-btn v2-btn--onaccent">Upload an STL</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="v2-section" id="how" aria-label="How it works">
        <div className="v2-wrap">
          <Reveal className="v2-section__head">
            <p className="v2-eyebrow">Process</p>
            <h2 className="v2-display-l" style={{ marginTop: 16 }}>From file to doorstep in five steps.</h2>
          </Reveal>
          <Reveal>
            <div className="v2-flow">
              {FLOW.map((f) => (
                <div className="v2-flow__step" key={f.n}>
                  <span className="v2-flow__n">{f.n}</span>
                  <h3 className="v2-flow__t">{f.t}</h3>
                  <p className="v2-flow__d">{f.d}</p>
                  <span className="v2-flow__connector" aria-hidden="true" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Material comparison bars ---------------- */}
      <section className="v2-section v2-section--tight" id="materials" aria-label="Material comparison">
        <div className="v2-wrap">
          <Reveal className="v2-section__head">
            <p className="v2-eyebrow">Seven materials</p>
            <h2 className="v2-display-l" style={{ marginTop: 16 }}>Pick by strength, heat, or cost.</h2>
            <p className="v2-lede">Real specs from our pricing engine — PLA+ for everyday brackets through to PA-CF for parts under load.</p>
          </Reveal>
          <Reveal>
            <MaterialBars />
          </Reveal>
        </div>
      </section>

      {/* ---------------- Statement block #2 (final CTA) ---------------- */}
      <section className="v2-statement" aria-label="Get started">
        <div className="v2-wrap">
          <div className="v2-statement__inner" style={{ textAlign: 'center', justifyItems: 'center' }}>
            <p className="v2-statement__eyebrow">Ready when you are</p>
            <h2 className="v2-statement__title" style={{ maxWidth: '18ch' }}>Upload an STL. See the number.</h2>
            <p className="v2-statement__body" style={{ marginInline: 'auto' }}>
              No account needed to quote. Drop a file and the price appears in under a minute.
            </p>
            <div className="v2-statement__cta" style={{ justifyContent: 'center' }}>
              <Link href="/quote" className="v2-btn v2-btn--onaccent">Get a quote →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="v2-footer" aria-label="Footer">
        <div className="v2-wrap">
          <div className="v2-footer__top">
            <div>
              <p className="v2-footer__wordmark">Print<span>Grid</span></p>
              <p className="v2-footer__tag">FDM 3D printing in Chennai. Real materials, honest prices, printed and shipped pan-India.</p>
            </div>
            <div className="v2-footer__cols">
              {FOOTER_COLS.map((col) => (
                <div className="v2-footer__col" key={col.h}>
                  <h4>{col.h}</h4>
                  {col.links.map((l) => (
                    <Link key={l.href} href={l.href}>{l.label}</Link>
                  ))}
                </div>
              ))}
              <div className="v2-footer__col">
                <h4>Reach us</h4>
                <a href="https://wa.me/917540023670" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <Link href="/contact">Email &amp; hours</Link>
                <span style={{ display: 'block', color: 'var(--v2-text-muted)', fontSize: '0.9rem', padding: '5px 0' }}>Chennai · Hyderabad pickup soon</span>
              </div>
            </div>
          </div>

          <div className="v2-footer__badges">
            {TRUST_BADGES.map((b) => (
              <span className="v2-badge" key={b}>{b}</span>
            ))}
          </div>

          <div className="v2-footer__legal">
            <span>© 2026 PrintGrid Studio · Chennai</span>
            <span>
              <Link href="/privacy">Privacy</Link> &nbsp;·&nbsp; <Link href="/terms">Terms</Link> &nbsp;·&nbsp; <Link href="/refund">Refund</Link>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
