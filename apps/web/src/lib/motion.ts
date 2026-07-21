import type { Variants } from 'framer-motion';

// Centralized, deliberately-used Framer Motion variants. Every consumer
// should pair these with `useReducedMotion()` from framer-motion and skip
// animation (render final state immediately) when it returns true — see
// components/shared/motion-provider usage in each component below.

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const cardHover = {
  rest: { y: 0 },
  hover: { y: -4, transition: { duration: 0.2, ease: 'easeOut' } },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export function reducedVariants(variants: Variants): Variants {
  const noop: Variants = {};
  for (const key of Object.keys(variants)) {
    noop[key] = { opacity: 1, y: 0, x: 0, transition: { duration: 0 } };
  }
  return noop;
}
