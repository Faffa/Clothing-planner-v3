import type { Variants } from 'framer-motion';

const EASE_MAISON: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const stagger: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

export const staggerFast: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.02 },
  },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_MAISON },
  },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: EASE_MAISON },
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: EASE_MAISON },
  },
};

export { EASE_MAISON };
