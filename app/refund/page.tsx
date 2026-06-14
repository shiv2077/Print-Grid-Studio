import type { Metadata } from 'next';
import { LegalPage, legalStyles as styles } from '@/app/_legal/LegalPage';

export const metadata: Metadata = {
  title: 'Refund &amp; cancellation policy',
  description:
    'When and how PrintGrid Studio refunds custom 3D-printed orders.',
};

export default function RefundPage() {
  return (
    <LegalPage
      eyebrow="LEGAL · REFUNDS"
      heading="Refund & cancellation policy"
      lastUpdated="09 May 2026"
    >
      <p className={styles.body}>
        Custom 3D-printed parts cannot be resold, so this policy is
        slightly tighter than the typical Indian e-commerce template.
        Read the matrix below before ordering — we want zero surprises.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>1 · Cancellations before printing</h2>
        <p className={styles.body}>
          Free cancellation any time before your order enters the
          printing status (you can see this on your order tracking page).
          Refund processed within 5 working days to the original payment
          method. Razorpay's bank-side timing usually adds 2-3 days on
          top.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>2 · Cancellations after printing has started</h2>
        <p className={styles.body}>
          Once a job is in the printer it cannot be paused without
          ruining the part. Cancellations after this point are at our
          discretion. Typically:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span>If we have not yet completed the first part of a multi-quantity job, we'll refund the unprinted balance.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span>Material cost on completed parts is non-refundable, but we'll ship the parts already made (you do not pay shipping again).</span>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>3 · Defective or damaged parts</h2>
        <p className={styles.body}>
          We dimensional-check every part. If something arrives with a
          visible manufacturing defect — layer separation, severe
          stringing or warping, missing features, wrong material —
          message us within 7 days of delivery with photos. Choose:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>+</span>
            <span><strong>Free reprint</strong> with priority queue placement.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>+</span>
            <span><strong>Full refund</strong> including original shipping; you don't have to ship the defective part back.</span>
          </li>
        </ul>
        <p className={styles.body}>
          Damage during shipping (crushed parcel, loose parts in a
          mangled box) is covered the same way if reported within 48
          hours with photos of the parcel and the parts inside.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>4 · Functional issues</h2>
        <p className={styles.body}>
          "It doesn't fit" or "it's not strong enough" are tricky for a
          custom-print service to refund automatically because the
          design is yours. Our policy:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span>If the printed part deviates from the STL bounding box by more than the stated tolerance (±0.3mm typical, ±0.15mm flagged), it's a manufacturing defect and we treat it under section 3.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span>If the part matches the STL but doesn't fit the assembly it was designed for, the design needs to change — we are happy to discuss orientation, infill, or material choices for the next print, but the original print is not refundable.</span>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>5 · How to request a refund</h2>
        <p className={styles.body}>
          WhatsApp the studio at{' '}
          <a href="https://wa.me/917540023670">+91 75400 23670</a> with
          your order code (PG-XXXX-XXXX), photos of the issue if
          relevant, and what you'd like (refund / reprint). We'll reply
          within one working day. Refunds are processed via Razorpay
          to the original payment method.
        </p>
      </section>

      <div className={styles.callout}>
        <p className={styles.calloutHeading}>BOTTOM LINE</p>
        <p className={styles.calloutBody}>
          We will not argue about defects on parts we made. If something
          is wrong with a print, tell us with a photo — reprint or
          refund, your call. We'd rather lose ₹500 in material than a
          customer.
        </p>
      </div>
    </LegalPage>
  );
}
