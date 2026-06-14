import type { Metadata } from 'next';
import { LegalPage, legalStyles as styles } from '@/app/_legal/LegalPage';

export const metadata: Metadata = {
  title: 'Shipping policy',
  description:
    'How PrintGrid Studio ships custom 3D-printed parts pan-India.',
};

export default function ShippingPage() {
  return (
    <LegalPage
      eyebrow="LEGAL · SHIPPING"
      heading="Shipping policy"
      lastUpdated="09 May 2026"
    >
      <p className={styles.body}>
        We ship pan-India from Anna Nagar, Chennai 600040 via tracked
        courier. The numbers below are typical times after a job clears
        QC; we don't promise dates but we do promise tracking.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>1 · Lead times</h2>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>Standard:</strong> Orders dispatch within 24 hours of QC. Tier-1 metros (Bengaluru, Hyderabad, Mumbai, Pune, Delhi, Kolkata) — 2-3 days. Other Tier-1/2 cities — 4 days. Remote pincodes — 5-7 days.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>Rush (+25%):</strong> Order moves to the front of the print queue. Adds about a working day on average. Total turnaround Chennai-to-most-metros around 3 days.</span>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>2 · Charges</h2>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>₹120 flat</strong> on orders below ₹2,500.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>Free</strong> on orders ₹2,500 and above.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span>International shipping is not currently offered.</span>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>3 · Couriers</h2>
        <p className={styles.body}>
          We use <strong>Delhivery</strong> by default and{' '}
          <strong>Bluedart</strong> for parcels above 1 kg or to remote
          pincodes. The choice is automatic based on what gives the
          better tracking quality for your destination — we don't pick
          for cost.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>4 · Tracking</h2>
        <p className={styles.body}>
          You'll get a tracking number by email and on your order page
          within an hour of dispatch. The order page on{' '}
          <a href="/orders">printgridstudio.com</a> stays the easiest
          way to check status — magic-link auth from the email keeps it
          accessible without a password.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>5 · Insurance &amp; lost parcels</h2>
        <p className={styles.body}>
          Orders ₹2,500 and above are insured for damaged-on-arrival
          and lost-in-transit. Below that, we'll still ship a
          replacement out of pocket if the courier loses the parcel —
          we just don't formally insure it because the parcel value
          is below the insurance premium threshold.
        </p>
        <p className={styles.body}>
          A parcel is considered lost if the courier has not updated
          tracking for 7 days or marks it undeliverable. WhatsApp the
          studio in either case and we'll start a reprint immediately
          while we work the courier complaint in the background.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>6 · Wrong address / undeliverable</h2>
        <p className={styles.body}>
          If a parcel comes back to us because the address was wrong or
          the recipient was unavailable, we'll redeliver once at no
          extra charge. A second redelivery is ₹120.
        </p>
      </section>

      <div className={styles.callout}>
        <p className={styles.calloutHeading}>SHIPPING IS A SOLVED PROBLEM</p>
        <p className={styles.calloutBody}>
          Tracking link in your inbox an hour after dispatch. Real
          courier tracking (not "shipped — see you in two weeks").
          Lost parcels are our problem, not yours.
        </p>
      </div>
    </LegalPage>
  );
}
