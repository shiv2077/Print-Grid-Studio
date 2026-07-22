import Link from 'next/link';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/materials', label: 'Materials' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Header() {
  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/" aria-label="PrintGrid Studio home">
        PrintGrid
      </Link>
      <nav className={styles.nav} aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} className={styles.navLink} href={link.href}>
            {link.label}
          </Link>
        ))}
        <Link className={styles.cta} href="/quote">
          Get a quote
        </Link>
      </nav>
    </header>
  );
}
