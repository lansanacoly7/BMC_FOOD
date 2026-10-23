import type { Transition, Variants } from 'motion/react'

/** Transitions standard pour des animations réactives et naturelles (feel 60-120 fps). */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

export const smoothTransition: Transition = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1], // easeOutExpo
}

/** Fade in simple. */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: smoothTransition,
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

/** Slide Up avec fondu : idéal pour les cartes et listes. */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
  exit: { opacity: 0, y: 12, transition: { duration: 0.15 } },
}

/** Scale In : idéal pour les modales, badges et boutons d'action. */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

/** Tiroir coulissant depuis le bas (Bottom Sheet mobile-first). */
export const bottomSheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring', damping: 32, stiffness: 350 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
}

/** Conteneur de liste avec apparition en cascade (stagger). */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
}

/** Feedback tactile sur bouton (micro-interaction tap). */
export const tapSpring = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: { duration: 0.15 },
}
