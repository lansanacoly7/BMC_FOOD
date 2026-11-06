import { ArrowRight, Clock } from 'lucide-react'
import { LoopingFadeVideo } from './LoopingFadeVideo'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'

interface HeroCinematicProps {
  onExploreMenu: () => void
  onOrderNow?: () => void
}

/** Variantes Motion harmonieuses pour l'entrée cadencée (stagger) */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

const badgeVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: 'easeOut',
    },
  },
}

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

const textVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: 'easeOut',
    },
  },
}

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: 'easeOut',
    },
  },
}

const metaVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
}

/**
 * Hero Cinématique BMC Food — Version Vidéo Unique Slow Motion Officielle :
 * - Vidéo MP4 officielle bmc_video_hero.mp4 en arrière-plan complet plein écran (SANS BOÎTE / SANS CADRE).
 * - Entrée séquentielle coordonnée (stagger) des éléments textuels.
 * - Discret reflet lumineux doré sur le bouton « Explorer le Menu » sans perturber le design.
 * - Voile dégradé protecteur à GAUCHE pour assurer la parfaite lisibilité des textes.
 */
export function HeroCinematic({ onExploreMenu }: HeroCinematicProps) {
  return (
    <section
      aria-label="Hero Signature BMC Food"
      className="relative isolate w-full overflow-hidden bg-black text-white"
    >
      {/* 
        1. VIDÉO UNIQUE SLOW MOTION EN BACKGROUND COMPLET
      */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden bg-black">
        <LoopingFadeVideo
          src="/images/hero/bmc_video_hero.mp4"
          className="size-full object-cover object-center"
        />
      </div>

      {/* 
        2. DÉGRADÉ LATÉRAL CINÉMA (SCRIM)
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/60 to-black/10 sm:w-4/5 lg:w-3/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black via-transparent to-black/30"
      />

      {/* 
        3. CONTENU TEXTE ÉQUILIBRÉ & ENTRÉE EN SCÈNE SÉQUENTIELLE
      */}
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-2xl text-left pl-3 sm:pl-6 md:pl-10 lg:pl-12"
        >
          {/* 1. Sur-titre */}
          <motion.p
            variants={badgeVariants}
            className="text-xs sm:text-sm font-medium text-bmc-gold"
          >
            BMC Food · Dakar
          </motion.p>

          {/* 2. Titre */}
          <motion.h1
            variants={titleVariants}
            className="mt-2.5 sm:mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]"
          >
            Le tacos de Dakar.
          </motion.h1>

          {/* 3. Descriptif */}
          <motion.p
            variants={textVariants}
            className="mt-3 max-w-lg text-sm sm:text-base text-zinc-200 leading-relaxed"
          >
            Viandes marinées, frites fraîches et sauce fromagère maison. Préparé à la commande.
          </motion.p>

          {/* 4. Bouton d'action */}
          <motion.div
            variants={buttonVariants}
            className="mt-5 flex items-center w-full sm:w-auto"
          >
            <button
              type="button"
              onClick={onExploreMenu}
              className="h-12 px-6 sm:px-8 flex items-center justify-center gap-2 rounded-lg bg-bmc-gold font-display text-sm sm:text-base font-semibold text-black hover:bg-amber-400 cursor-pointer transition-colors whitespace-nowrap group"
            >
              <span>Voir la carte</span>
              <ArrowRight className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </motion.div>

          {/* 5. Horaires et livraison */}
          <motion.div
            variants={metaVariants}
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-zinc-300"
          >
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-bmc-gold" />
              <span>Mardi – dimanche, 11h – 02h</span>
            </div>
            <span className="text-zinc-200">Livraison à Dakar</span>
          </motion.div>
        </motion.div>
      </div>

      {/* 
        4. DÉGRADÉ FONDU PROGRESSIF EN BAS
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-zinc-950"
      />
    </section>
  )
}
