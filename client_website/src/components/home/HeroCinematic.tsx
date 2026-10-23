import { Sparkles, ArrowRight, UtensilsCrossed, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'

interface HeroCinematicProps {
  onExploreMenu: () => void
  onOrderNow?: () => void
  onOpenAuth?: () => void
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
export function HeroCinematic({ onExploreMenu, onOpenAuth }: HeroCinematicProps) {
  return (
    <section
      aria-label="Hero Signature BMC Food"
      className="relative isolate w-full overflow-hidden bg-black text-white"
    >
      {/* 
        1. VIDÉO UNIQUE SLOW MOTION EN BACKGROUND COMPLET
      */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="size-full object-cover object-center filter contrast-105"
        >
          <source src="/images/hero/bmc_video_hero.mp4" type="video/mp4" />
        </video>
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
          {/* 1. Sur-titre Or officiel BMC FOOD */}
          <motion.div
            variants={badgeVariants}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] sm:tracking-[0.25em] text-bmc-gold"
          >
            <Sparkles className="size-3 sm:size-3.5 text-bmc-gold" />
            <span>BMC FOOD · SAVEURS SIGNATURES</span>
          </motion.div>

          {/* 2. Grand Titre proportionné */}
          <motion.h1
            variants={titleVariants}
            className="mt-2.5 sm:mt-3 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.08] sm:leading-[1.04]"
          >
            La Révolution <br />
            <span className="bg-gradient-to-r from-bmc-gold via-amber-200 to-amber-500 bg-clip-text text-transparent">
              Culinaire
            </span>{' '}
            Est Arrivée.
          </motion.h1>

          {/* 3. Descriptif officiel */}
          <motion.p
            variants={textVariants}
            className="mt-2.5 sm:mt-3.5 max-w-lg text-xs sm:text-sm lg:text-base text-zinc-200 font-normal leading-relaxed"
          >
            L'incontournable <strong className="font-bold text-white">Tacos de Dakar</strong> : viandes marinées savoureuses, frites fraîches et sauce fromagère onctueuse maison. Préparé à la commande.
          </motion.p>

          {/* 4. Boutons d'Action : Explorer le Menu & Connexion / Inscription */}
          <motion.div
            variants={buttonVariants}
            className="mt-4 sm:mt-5 flex flex-wrap items-center gap-3 w-full sm:w-auto"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              onClick={onExploreMenu}
              aria-label="Explorer le menu BMC Food"
              className="relative overflow-hidden h-11 sm:h-13 px-5 sm:px-8 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-bmc-gold/30 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap group"
            >
              {/* Discret reflet lumineux (shimmer) balayant le bouton à intervalle régulier */}
              <motion.span
                aria-hidden="true"
                initial={{ x: '-130%' }}
                animate={{ x: '230%' }}
                transition={{
                  repeat: Infinity,
                  repeatDelay: 5,
                  duration: 1.5,
                  ease: 'easeInOut',
                }}
                className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              />

              <UtensilsCrossed className="size-3.5 sm:size-4 text-black stroke-[2.5] shrink-0" />
              <span>Explorer le Menu</span>
              <ArrowRight className="size-3.5 sm:size-4 text-black stroke-[2.5] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </motion.button>

            {onOpenAuth && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenAuth}
                aria-label="Connexion ou Inscription client BMC Food"
                className="relative overflow-hidden h-11 sm:h-13 px-4 sm:px-6 flex items-center justify-center gap-2.5 rounded-xl border border-bmc-gold/60 bg-zinc-950/80 hover:bg-zinc-900 text-white font-display text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-black/50 hover:border-bmc-gold cursor-pointer transition-all whitespace-nowrap group backdrop-blur-md"
              >
                <img
                  src="/images/brand/logo.png"
                  alt="BMC"
                  className="h-5 sm:h-6 w-auto object-contain transition-transform group-hover:scale-110 shrink-0"
                />
                <span className="text-zinc-100 group-hover:text-bmc-gold transition-colors">
                  Connexion / Inscription
                </span>
              </motion.button>
            )}
          </motion.div>

          {/* 5. Horaires et livraison discrets */}
          <motion.div
            variants={metaVariants}
            className="mt-4 sm:mt-5 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-zinc-300 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 sm:size-3.5 text-bmc-gold" />
              <span>Ouvert 11h – 02h (Mar–Dim)</span>
            </div>
            <span className="size-1 rounded-full bg-zinc-500" />
            <span className="text-zinc-200">Livraison express Dakar</span>
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
