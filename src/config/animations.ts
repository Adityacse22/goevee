/**
 * CONFIG — Shared framer-motion animation variants.
 * These were copy-pasted identically in Index.tsx, Login.tsx, SignUp.tsx,
 * BookingForm.tsx, StationList.tsx, Footer.tsx, and Navbar.tsx.
 * Now imported from a single source of truth.
 */

import type { Variants } from 'framer-motion';

/**
 * Staggered fade-in container — apply to a wrapper and use `itemVariants`
 * on each child for a cascading reveal effect.
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Spring-based slide-up for individual items inside a stagger container.
 */
export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 12,
    },
  },
};

/**
 * Slide-up for form elements — identical to `itemVariants` but with
 * stiffer damping suited for form fields.
 */
export const formItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
    },
  },
};

/**
 * Nav-specific variant with higher stiffness for snappier entrance.
 */
export const navVariants: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      staggerChildren: 0.1,
    },
  },
};

/**
 * Nav item variant (re-used inside Navbar).
 */
export const navItemVariants: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

/**
 * Horizontal slide-in variant used by StationList cards.
 */
export const slideInVariants: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};
