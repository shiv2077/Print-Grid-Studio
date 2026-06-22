'use client';

import { useEffect, useState } from 'react';

/**
 * Theme toggle. The initial data-theme is set by an inline script in the
 * layout before paint; this just flips it and persists the choice. Dispatches
 * a `themechange` event so other modules (e.g. the 3D viewer) can re-paint.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const cur = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    setTheme(cur);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('printgrid-theme', next);
    } catch {
      /* private mode etc. */
    }
    setTheme(next);
    document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  };

  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-label="Toggle colour theme">
      {theme === 'dark' ? 'LIGHT' : 'DARK'}
    </button>
  );
}
