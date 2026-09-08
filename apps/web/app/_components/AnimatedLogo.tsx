'use client';

import { motion, useReducedMotion } from 'framer-motion';

const drawTransition = {
  duration: 1.6,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function AnimatedLogo() {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? 1 : 0;

  return (
    <motion.div
      className="v2-animated-logo"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      aria-label="PrintGrid mark"
    >
      <svg viewBox="0 0 116 116" role="img" aria-hidden="true">
        {/* Swap these placeholder paths for the final PrintGrid SVG logo when it is available. */}
        <motion.path
          d="M58 10 99 34v48L58 106 17 82V34L58 10Z"
          initial={{ pathLength: initial }}
          animate={{ pathLength: 1 }}
          transition={drawTransition}
        />
        <motion.path
          d="M17 34 58 58l41-24M58 58v48M33 43v30l25 15 25-15V43"
          initial={{ pathLength: initial }}
          animate={{ pathLength: 1 }}
          transition={{ ...drawTransition, delay: reduceMotion ? 0 : 0.22 }}
        />
        <motion.path
          d="M45 50v16l13 8 13-8V50"
          initial={{ pathLength: initial }}
          animate={{ pathLength: 1 }}
          transition={{ ...drawTransition, delay: reduceMotion ? 0 : 0.44 }}
        />
      </svg>
    </motion.div>
  );
}
