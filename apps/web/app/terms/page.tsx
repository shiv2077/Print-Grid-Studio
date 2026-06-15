import type { Metadata } from 'next';
import { LegalPage, legalStyles as styles } from '@/app/_legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of service',
  description:
    'The terms governing the use of PrintGrid Studio and the manufacture of custom 3D-printed parts.',
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="LEGAL · TERMS"
      heading="Terms of service"
      lastUpdated="09 May 2026"
    >
      <p className={styles.body}>
        These terms govern the use of PrintGrid Studio
        (printgridstudio.com) and the manufacture of 3D-printed parts
        on order. By placing an order you agree to them. We are a
        sole-proprietor business operated by Aadharsh J. from Anna
        Nagar, Chennai 600040. Our principal place of supply is Tamil
        Nadu.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>1 · Quotes &amp; orders</h2>
        <p className={styles.body}>
          Quotes are calculated by the engine in your browser based on
          mass estimation from your STL geometry and the configuration
          you choose. The price you see at checkout is the price you
          pay; we do not adjust it after order placement except in case
          of a clear engine error, in which case we will contact you
          before printing.
        </p>
        <p className={styles.body}>
          Orders are confirmed when payment is received. We may decline
          to fulfil an order at our discretion (see "What we won't
          print" on the <a href="/about">about page</a>); in that case
          we refund the full amount within 7 working days.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>2 · Intellectual property</h2>
        <p className={styles.body}>
          You retain ownership of the STL files you upload. You grant
          us the right to use them solely for printing your order and
          for the warranty period thereafter. You confirm that you have
          the right to print the file — copyrighted, trademarked, or
          patented designs without authorisation are your responsibility,
          not ours.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>3 · Quality &amp; warranty</h2>
        <p className={styles.body}>
          We dimensional-check every part before pack-out. Visible
          defects from manufacturing — layer separation, severe stringing,
          warpage, missing features — are covered by a free reprint or
          full refund within 7 days of delivery. Damage during shipping
          is covered if reported within 48 hours of delivery with
          photos of the unopened parcel.
        </p>
        <p className={styles.body}>
          Functional fitness for purpose is the customer's
          responsibility. FDM prints have anisotropic strength (weaker
          along layer lines) — if you are designing structural parts,
          we are happy to suggest orientation, infill, or material
          adjustments before you order.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>4 · Liability</h2>
        <p className={styles.body}>
          Our total liability for any order is capped at the amount you
          paid for that order. We are not liable for indirect or
          consequential losses (loss of business, downtime, etc.). For
          parts intended for safety-critical, medical, or aerospace
          applications, please obtain independent qualification — we
          do not warrant compliance with any regulatory standard.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>5 · Cancellations</h2>
        <p className={styles.body}>
          You can cancel a paid order before it enters the printing
          status (visible on your order tracking page) for a full
          refund. After printing has started, see the{' '}
          <a href="/refund">refund policy</a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>6 · Pricing &amp; tax</h2>
        <p className={styles.body}>
          Prices are in Indian Rupees (₹) and include 18% GST. Tamil
          Nadu customers pay 9% CGST + 9% SGST; out-of-state customers
          pay 18% IGST. A tax invoice is generated at the time of
          order and emailed to you. Provide your GSTIN at checkout if
          you need it on the invoice.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>7 · Governing law &amp; disputes</h2>
        <p className={styles.body}>
          These terms are governed by the laws of India. Any dispute
          will be subject to the exclusive jurisdiction of the courts
          of Chennai, Tamil Nadu. We strongly prefer to resolve
          disputes by direct conversation — please WhatsApp or email
          before pursuing formal action.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>8 · Changes</h2>
        <p className={styles.body}>
          We may update these terms occasionally. Material changes
          (anything that affects your existing orders or rights) will
          be communicated by email at least 14 days before they take
          effect.
        </p>
      </section>

      <div className={styles.callout}>
        <p className={styles.calloutHeading}>CONTACT</p>
        <p className={styles.calloutBody}>
          PrintGrid Studio · Anna Nagar, Chennai 600040 · GSTIN
          pending · WhatsApp{' '}
          <a href="https://wa.me/917540023670">+91 75400 23670</a> ·{' '}
          <a href="mailto:aadharsh.j10@gmail.com">aadharsh.j10@gmail.com</a>
        </p>
      </div>
    </LegalPage>
  );
}
