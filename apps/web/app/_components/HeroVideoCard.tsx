'use client';

import { motion, useReducedMotion } from 'framer-motion';

const stages = ['Upload', 'Live Quote', 'Printing', 'Delivery'];

export function HeroVideoCard() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="v2-video-card-wrap">
      <motion.article
        className="v2-video-card"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 28, rotate: reduceMotion ? 0 : 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.24 }}
        whileHover={reduceMotion ? undefined : { y: -10, rotateX: 2, rotateY: -2, scale: 1.012 }}
        style={{ transformPerspective: 1200 }}
      >
        <div className="v2-video-card__progress" aria-label="Print order progress">
          {stages.map((stage, index) => (
            <div className="v2-video-card__stage" key={stage} data-active={index < 2}>
              <span className="v2-video-card__stage-dot" />
              <span>{stage}</span>
            </div>
          ))}
        </div>
        <div className="v2-video-card__media">
          <video autoPlay loop muted playsInline preload="metadata" aria-label="A minimalist 3D print in progress">
            <source src="/video/Prompt_A_high_end_minimalist.mp4" type="video/mp4" />
          </video>
          <div className="v2-video-card__overlay" aria-hidden="true" />
          <div className="v2-video-card__caption">
            <span>PG / 01</span>
            <span>3D print, made precise</span>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
