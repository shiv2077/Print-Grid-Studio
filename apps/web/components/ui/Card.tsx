'use client';

import { motion, useReducedMotion } from 'motion/react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Pure so it's testable without rendering or triggering a real hover. */
export function getHoverAnimation(
  reduceMotion: boolean
): { y: number; borderColor: string } | undefined {
  if (reduceMotion) return undefined;
  return { y: -4, borderColor: 'var(--accent-teal)' };
}

export function Card({ children, className }: CardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={clsx(styles.card, className)}
      whileHover={getHoverAnimation(!!reduceMotion)}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
