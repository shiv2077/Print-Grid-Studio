'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Container } from '@/components/ui/Container';
import { MobileMenu } from './MobileMenu';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/materials', label: 'Materials' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Header() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setScrolled(!entry.isIntersecting);
      },
      { rootMargin: '-80px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden />
      <header
        className={clsx(styles.header, scrolled && styles.scrolled, scrolled && 'glass')}
      >
        <Container>
          <div className={styles.row}>
            <Link href="/" className={styles.wordmark} aria-label="PrintGrid Studio home">
              <span className={styles.wordmarkPrimary}>PRINTGRID</span>
              <span className={styles.wordmarkSub}>studio · 3d printing</span>
            </Link>
            <nav className={styles.nav} aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link href="/quote" className={styles.cta}>
              Get a quote →
            </Link>
            <MobileMenu links={NAV_LINKS} />
          </div>
        </Container>
      </header>
    </>
  );
}
