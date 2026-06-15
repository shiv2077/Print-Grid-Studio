'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import styles from './Header.module.css';

export interface MobileMenuLink {
  readonly href: string;
  readonly label: string;
}

export interface MobileMenuProps {
  links: ReadonlyArray<MobileMenuLink>;
}

export function MobileMenu({ links }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.hamburger}
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} aria-hidden />
      </button>
      {open && (
        <div className={`${styles.overlay} glass-overlay`} role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className={styles.overlayHeader}>
            <span className={styles.overlayWordmark}>PRINTGRID</span>
            <button
              type="button"
              className={styles.overlayClose}
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <nav className={styles.overlayNav} aria-label="Mobile primary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.overlayNavLink}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className={styles.overlayCta}>
            <Link
              href="/quote"
              className={styles.ctaFullWidth}
              onClick={() => setOpen(false)}
            >
              Get a quote →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
