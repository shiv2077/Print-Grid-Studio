import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import styles from './Footer.module.css';

const PAGE_LINKS = [
  { href: '/quote', label: 'Get a quote' },
  { href: '/materials', label: 'Materials' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refunds' },
  { href: '/shipping', label: 'Shipping' },
] as const;

export function Footer() {
  return (
    <footer className={`${styles.footer} on-ink`} aria-labelledby="footer-heading">
      <h2 id="footer-heading" className={styles.srOnly}>
        PrintGrid Studio
      </h2>
      <Container>
        <div className={styles.grid}>
          <div className={styles.col}>
            <p className={styles.wordmark}>PRINTGRID</p>
            <p className={styles.wordmarkSub}>studio · 3d printing</p>
            <p className={styles.tagline}>
              Custom 3D printing from a small Chennai studio. Real materials,
              honest prices, ships pan-India in 4 days.
            </p>
          </div>
          <div className={styles.col}>
            <p className={styles.colHeading}>Pages</p>
            {PAGE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className={styles.col}>
            <p className={styles.colHeading}>Legal</p>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className={styles.col}>
            <p className={styles.colHeading}>Contact</p>
            <div className={styles.contact}>
              <a
                href="https://wa.me/917540023670"
                className={styles.contactValue}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp · +91 75400 23670
              </a>
              <a
                href="mailto:aadharsh.j10@gmail.com"
                className={styles.contactValue}
              >
                aadharsh.j10@gmail.com
              </a>
              <span className={`micro ${styles.contactMeta}`}>
                Mon–Sat · 10–7 IST
              </span>
              <span className={`micro ${styles.contactMeta}`}>
                Anna Nagar, Chennai
              </span>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <p className={styles.bottomNote}>
            © 2026 PRINTGRID STUDIO · Chennai, India
          </p>
          <p className={styles.bottomNote}>GSTIN — pending</p>
        </div>
      </Container>
    </footer>
  );
}
