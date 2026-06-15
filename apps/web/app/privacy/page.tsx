import type { Metadata } from 'next';
import { LegalPage, legalStyles as styles } from '@/app/_legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How PrintGrid Studio collects, uses, and protects personal information.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGAL · PRIVACY"
      heading="Privacy policy"
      lastUpdated="09 May 2026"
    >
      <p className={styles.body}>
        PrintGrid Studio ("we", "us") is a sole-proprietor 3D printing
        service operated by Aadharsh J. from Anna Nagar, Chennai. This
        page explains what personal information we collect, how we use
        it, who we share it with, and how to ask us to delete it. We
        keep this short on purpose — there is not much.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>1 · What we collect</h2>
        <p className={styles.body}>
          When you place an order we collect:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>+</span>
            <span>Your name, email address, phone number, and shipping address.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>+</span>
            <span>Your STL file(s) and the print configuration you chose.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>+</span>
            <span>Your GSTIN if you provide one (only for invoice issuance — never displayed publicly).</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>+</span>
            <span>Razorpay's payment-method tokens (we never see your full card details).</span>
          </li>
        </ul>
        <p className={styles.body}>
          When you visit the site without ordering, our hosting
          provider logs the standard request metadata (IP, user agent,
          timestamp). We do not run third-party analytics with cookies,
          ad pixels, or session replay.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>2 · How we use it</h2>
        <p className={styles.body}>
          We use your details to fulfil your order — printing, packing,
          shipping, invoicing, and replying to support questions. We
          send transactional email about your order status. We do not
          send marketing email unless you have asked us to.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>3 · Who we share it with</h2>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>Razorpay</strong> for payment processing.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>Delhivery</strong> or <strong>Bluedart</strong> for shipping (we share name, address, phone — not the STL).</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>Resend</strong> (transactional email delivery).</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>Cloudflare R2</strong> for STL file storage.</span>
          </li>
          <li className={styles.listItem}>
            <span className={styles.listBullet}>·</span>
            <span><strong>Indian tax authorities</strong> if and when required by GST law.</span>
          </li>
        </ul>
        <p className={styles.body}>
          We do not sell, rent, or trade personal information.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>4 · How long we keep it</h2>
        <p className={styles.body}>
          STLs are deleted within 90 days of order completion unless you
          ask us to keep them on file for re-orders. Order metadata
          (invoice fields) is retained for 7 years to satisfy Indian
          tax record-keeping requirements. Marketing email lists, if
          you joined one, you can unsubscribe from with one click.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>5 · Your rights</h2>
        <p className={styles.body}>
          You can ask us to: confirm what we hold about you, correct
          anything wrong, delete your account and STLs, or export your
          data in a machine-readable format. Email{' '}
          <a href="mailto:aadharsh.j10@gmail.com">aadharsh.j10@gmail.com</a>{' '}
          and we will respond within 14 days.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>6 · Changes to this policy</h2>
        <p className={styles.body}>
          If we change this page in any material way we will email
          existing customers with the change before it takes effect.
        </p>
      </section>

      <div className={styles.callout}>
        <p className={styles.calloutHeading}>QUESTIONS</p>
        <p className={styles.calloutBody}>
          WhatsApp{' '}
          <a href="https://wa.me/917540023670">+91 75400 23670</a> or
          email{' '}
          <a href="mailto:aadharsh.j10@gmail.com">aadharsh.j10@gmail.com</a>.
          Real human reply within one working day.
        </p>
      </div>
    </LegalPage>
  );
}
