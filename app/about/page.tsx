import type { Metadata } from 'next';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About',
  description:
    'PrintGrid Studio is a small Chennai 3D-printing studio run by Aadharsh, with two Bambu P1S printers and a serious tolerance gauge.',
};

const STUDIO_SPECS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'PRINTERS', value: 'Bambu P1S × 2 (enclosed)' },
  { label: 'MULTI-MATERIAL', value: 'AMS · 4-spool selector' },
  { label: 'BUILD VOLUME', value: '256 × 256 × 256 mm' },
  { label: 'NOZZLES', value: '0.4 mm hardened steel' },
  { label: 'QC TOOLING', value: 'Mitutoyo digital calipers' },
  { label: 'LOCATION', value: 'Anna Nagar, Chennai 600 040' },
  { label: 'CAPACITY', value: '~120 print-hours/week' },
];

interface StandardEntry {
  symbol: string;
  text: string;
  accent?: boolean;
}

const STANDARDS_GREEN: ReadonlyArray<StandardEntry> = [
  { symbol: '+', text: 'Tolerance ±0.3 mm typical, ±0.15 mm if you flag the part as high-precision before we print.' },
  { symbol: '+', text: 'Every order is dimensionally checked against the source STL bounding box before pack-out. Visible defects → reprint at our cost.' },
  { symbol: '+', text: 'PA6 and PA-CF spools are dried at 70°C for ≥4 hours before each print. Dry filament is the difference between a part that holds and a part that splinters.' },
  { symbol: '+', text: 'Multi-piece assemblies get fitment checked together before they ship. Loose tolerances on mating parts are the most common reason for a remake.' },
];

const STANDARDS_RED: ReadonlyArray<StandardEntry> = [
  { symbol: '×', text: 'Functional firearm parts. Including replicas marketed as "training". Hard no.', accent: true },
  { symbol: '×', text: 'Active medical devices that contact the body or carry a load (orthotics, prosthetics, dental). FDM is the wrong process — use SLA or SLS.', accent: true },
  { symbol: '×', text: 'Branded items where you cannot show the rights (pop-culture characters, logos, copyrighted models).', accent: true },
  { symbol: '×', text: 'Structural parts with wall thickness under 0.5 mm. Material limits, not policy — we will tell you what minimum to use.', accent: true },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero / intro */}
      <Section bg="paper" gridPaper>
        <Container>
          <div className={styles.column}>
            <p className={`h-eyebrow ${styles.eyebrow}`}>
              ABOUT · PRINTGRID STUDIO
            </p>
            <h1 className={`display ${styles.heroHeadline}`}>
              A small studio. Real parts.
            </h1>
            <p className={`lede ${styles.heroLede}`}>
              PrintGrid Studio is one operator, two Bambu P1S printers,
              and a desk in Anna Nagar. We print custom parts on order.
              No catalog drop-ships, no white-label resale, no AI-quote
              chatbot. The number you see is the number you pay.
            </p>
          </div>
        </Container>
      </Section>

      {/* Origin */}
      <Section bg="paper-warm">
        <Container>
          <div className={styles.column}>
            <p className={`h-eyebrow ${styles.sectionEyebrow}`}>01 · ORIGIN</p>
            <h2 className={`display-2 ${styles.sectionHeading}`}>
              How this studio came to be.
            </h2>
            <p className={styles.body}>
              I started printing in 2022 because I needed a drone bracket
              that nobody sold. The closest service shop in Chennai
              quoted seven days, ₹1,800, and asked me to email an STL to
              a Gmail address. After two weeks of "we'll get back to
              you," I bought a printer. Within a year I'd printed 200
              parts for myself and another 50 for friends who'd asked
              "could you make me one of those?".
            </p>
            <p className={styles.body}>
              By 2024 the friends-and-family pipeline had outgrown the
              evenings. PrintGrid is what came out of that — a service
              that quotes in seconds, prices honestly, and ships in
              days. The same calculator that runs your quote runs mine.
              There is no "enterprise tier" hiding behind a sales call.
            </p>
            <p className={styles.body}>
              We're small on purpose. Two printers running 16 hours a
              day is the right capacity for the kind of part nobody else
              wants to make: the one-off, the bracket, the gasket, the
              prototype with three iterations to come. If you need a
              thousand identical parts a week, we are not the right
              shop — but we know who is and we'll point you at them.
            </p>
          </div>
        </Container>
      </Section>

      {/* The Studio */}
      <Section bg="paper">
        <Container>
          <div className={styles.column}>
            <p className={`h-eyebrow ${styles.sectionEyebrow}`}>02 · THE STUDIO</p>
            <h2 className={`display-2 ${styles.sectionHeading}`}>
              The hardware in the room.
            </h2>
            <p className={styles.body}>
              Two <strong>Bambu Lab P1S</strong> printers in CoreXY
              configuration with active enclosures, hardened nozzles,
              and an AMS multicolour selector. Both run on the same
              firmware version and the same slicing profiles, so a job
              prints identically on either machine. We rotate them
              evenly — you don't get a "second printer" that's
              secretly worse.
            </p>
            <p className={styles.body}>
              For QC we use a Mitutoyo digital caliper for dimensional
              checks and a small lightbox for surface defect spotting.
              No fancy CT scan. A printed part either fits or it
              doesn't, and the caliper tells you in 10 seconds.
            </p>
            <ul className={styles.specList}>
              {STUDIO_SPECS.map((s) => (
                <li key={s.label} className={styles.specRow}>
                  <span className={styles.specLabel}>{s.label}</span>
                  <span className={styles.specValue}>{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Standards */}
      <Section bg="paper-warm">
        <Container>
          <div className={styles.column}>
            <p className={`h-eyebrow ${styles.sectionEyebrow}`}>03 · STANDARDS</p>
            <h2 className={`display-2 ${styles.sectionHeading}`}>
              What we'll print, what we won't.
            </h2>
            <p className={styles.body}>
              We are happy to print most things. The list of "won't"
              below is short and policy-driven, not technical. If your
              part has a borderline use, ask first — we'd rather have
              an awkward conversation up front than a refund later.
            </p>

            <p className={`h-eyebrow ${styles.standardsLabel}`}>WE WILL</p>
            <ul className={styles.standardsList}>
              {STANDARDS_GREEN.map((s, i) => (
                <li key={i} className={styles.standardsRow}>
                  <span className={styles.standardsBullet}>{s.symbol}</span>
                  <span className={styles.standardsText}>{s.text}</span>
                </li>
              ))}
            </ul>

            <p className={`h-eyebrow ${styles.standardsLabelGap}`}>WE WON'T</p>
            <ul className={styles.standardsList}>
              {STANDARDS_RED.map((s, i) => (
                <li key={i} className={styles.standardsRow}>
                  <span
                    className={`${styles.standardsBullet} ${
                      s.accent ? styles.standardsBulletAccent : ''
                    }`}
                  >
                    {s.symbol}
                  </span>
                  <span className={styles.standardsText}>{s.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Founder */}
      <Section bg="ink">
        <Container>
          <div className={styles.column}>
            <p className={`h-eyebrow ${styles.sectionEyebrow}`}>04 · FOUNDER</p>
            <h2 className={`display-2 ${styles.sectionHeading}`}>
              The person on the other side of the print.
            </h2>
            <div className={styles.founderLayout}>
              <div className={styles.founderPhoto} aria-hidden>
                <div className={styles.founderPhotoTitleBlock}>
                  <span>PG-FNDR-AJ</span>
                  <span>PHOTO · TBD</span>
                </div>
                <div className={styles.founderPhotoBody}>
                  <span className={styles.founderPhotoLabel}>AADHARSH</span>
                  <span className={styles.founderPhotoNote}>
                    Real photo before launch.
                  </span>
                </div>
              </div>
              <div className={styles.founderBio}>
                <p className={styles.founderRole}>FOUNDER · CHENNAI</p>
                <p className={styles.founderName}>Aadharsh J.</p>
                <p className={styles.founderText}>
                  Mechanical engineer by training, drone hobbyist by
                  weekends, accidental printer-shop operator by 2024.
                  Runs every print, packs every order, replies to every
                  WhatsApp himself. There is no support team.
                </p>
                <div className={styles.founderLinks}>
                  <a
                    href="https://wa.me/917540023670"
                    className={styles.founderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp · +91 75400 23670
                  </a>
                  <a
                    href="mailto:aadharsh.j10@gmail.com"
                    className={styles.founderLink}
                  >
                    aadharsh.j10@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
