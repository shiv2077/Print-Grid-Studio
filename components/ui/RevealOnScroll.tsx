'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './RevealOnScroll.module.css';

export interface RevealOnScrollProps {
  delay?: number;
  className?: string;
  children: React.ReactNode;
  /**
   * If true, the wrapper is rendered with reveal-on-scroll class
   * (which the global reduced-motion rule targets) and the per-component
   * `.reveal` class. Default true. Set false to disable the wrapper and
   * just render children — useful when you need a server-only render
   * path but want the same JSX shape.
   */
  enabled?: boolean;
}

export function RevealOnScroll({
  delay = 0,
  className,
  children,
  enabled = true,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          if (delay > 0) {
            const timeoutId = window.setTimeout(() => setVisible(true), delay);
            // Best-effort cleanup if the component unmounts during delay.
            // We can't return cleanup from inside this callback so we
            // accept the small race; effect cleanup below disconnects
            // the observer regardless.
            node.dataset.revealTimeout = String(timeoutId);
          } else {
            setVisible(true);
          }
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      const t = node.dataset.revealTimeout;
      if (t) window.clearTimeout(Number(t));
    };
  }, [delay, enabled]);

  return (
    <div
      ref={ref}
      className={clsx(
        'reveal-on-scroll',
        styles.reveal,
        visible && styles.visible,
        className
      )}
    >
      {children}
    </div>
  );
}
