'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { NAV_LINKS } from '../_data';

/** Floating pill nav. Transparent over the hero, solid + shadow + slight shrink
 *  once scrolled past a sentinel at the hero base. State is driven by an
 *  IntersectionObserver (no per-frame scroll handler → no jank, no layout shift
 *  since the bar is position:fixed). Mobile collapses to an accessible
 *  hamburger disclosure (aria-expanded, Esc to close, focus returned). */
export function NavPill() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  // sentinel lives in the DOM (rendered below); observe it
  useEffect(() => {
    const sentinel = document.getElementById('v2-nav-sentinel');
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => { const e = entries[0]; if (e) setScrolled(!e.isIntersecting); },
      { threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // close mobile menu on Esc; return focus to the toggle
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); burgerRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className="v2-navwrap">
        <nav className="v2-nav" data-scrolled={scrolled} aria-label="Primary">
          <Link href="/" className="v2-nav__brand">
            <span className="v2-nav__mark">▶</span> PrintGrid
          </Link>

          <div className="v2-nav__links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="v2-nav__link">{l.label}</a>
            ))}
          </div>

          <div className="v2-nav__cta">
            <Link href="/orders" className="v2-nav__login">Track order</Link>
            <Link href="/quote" className="v2-nav__quote">Get a quote</Link>
          </div>

          <button
            ref={burgerRef}
            type="button"
            className="v2-nav__burger"
            aria-expanded={open}
            aria-controls="v2-mobilemenu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            )}
          </button>
        </nav>
      </div>

      {open && (
        <div className="v2-mobilemenu" id="v2-mobilemenu">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Link href="/orders" onClick={() => setOpen(false)}>Track order</Link>
          <div className="v2-mobilemenu__cta">
            <Link href="/quote" className="v2-btn v2-btn--primary" onClick={() => setOpen(false)} style={{ justifyContent: 'center' }}>Get a quote</Link>
          </div>
        </div>
      )}
    </>
  );
}
