// =====================================================
// ANIMATION PRIMITIVES — Framer Motion variants
// Butun loyiha uchun bir xil animatsiyalar
// =====================================================

import type { Variants, Transition } from 'framer-motion';

// Universal easings
export const EASING = {
  smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
  swift: [0.4, 0, 0.2, 1] as [number, number, number, number],
  spring: { type: 'spring', stiffness: 260, damping: 26 } as Transition,
  springBouncy: { type: 'spring', stiffness: 380, damping: 22 } as Transition,
};

// Sahifa fade-in
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASING.smooth },
  },
};

// Stagger container (bir nechta bolalarni ketma-ket animatsiyalash)
export const staggerContainer = (delayChildren = 0.05, staggerChildren = 0.06): Variants => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren,
      staggerChildren,
    },
  },
});

// Kartochka entry
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASING.smooth },
  },
};

// Slide up
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASING.smooth },
  },
};

// Slide right
export const slideRight: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EASING.smooth },
  },
};

// Scale in
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: EASING.spring,
  },
};

// Fade
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// Hover effect uchun (whileHover prop'iga)
export const hoverLift = {
  y: -2,
  scale: 1.01,
  transition: { duration: 0.2, ease: EASING.swift },
};
