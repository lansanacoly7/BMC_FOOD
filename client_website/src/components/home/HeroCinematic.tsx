import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'motion/react'
import { useOpeningStatus } from '../../hooks/useOpeningStatus'
import { OPENING_HOURS_LABEL } from '../../lib/openingHours'
import { Embers } from '../brand/Embers'
import { LoopingFadeVideo } from './LoopingFadeVideo'

interface HeroCinematicProps {
  onExploreMenu: () => void
  onOrderNow?: () => void
  /**
   * Vrai dès que le rideau de l'intro commence à se lever : l'entrée en scène se joue pendant la levée,
   * sous les yeux du client. Avant, le hero attend dans son état de départ (flou et chaud, jamais noir).
   */
  isRevealed?: boolean
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

const TITLE = 'Le tacos de Dakar.'
/** Mots du titre et, pour chaque lettre, son rang dans tout le titre (pour l'enchaînement lettre par lettre). */
const TITLE_WORDS = TITLE.split(' ').reduce<{ word: string; letters: { char: string; index: number }[] }[]>((words, word) => {
  const start = words.reduce((count, w) => count + w.letters.length, 0)
  return [...words, { word, letters: [...word].map((char, i) => ({ char, index: start + i })) }]
}, [])
/** Début du titre après le lever du rideau (s) et écart entre deux lettres. */
const TITLE_START = 0.42
const LETTER_GAP = 0.028

/* ---------- Variantes de l'entrée ---------- */

/** Mise au point : l'image arrive floue, chaude et rapprochée, puis se pose nette. */
const focusPull: Variants = {
  closed: { scale: 1.16, filter: 'blur(18px) brightness(0.7) saturate(1.25)' },
  open: {
    scale: 1,
    filter: 'blur(0px) brightness(1) saturate(1)',
    transition: { duration: 2.1, ease: EASE_OUT_EXPO },
  },
}

/** Voile or chaud qui s'efface avec la mise au point : on sort de l'intro comme d'une braise. */
const warmVeil: Variants = {
  closed: { opacity: 0.55 },
  open: { opacity: 0, transition: { duration: 1.8, ease: 'easeOut', delay: 0.2 } },
}

/** Les braises de l'intro continuent leur montée dans le hero, puis s'éteignent doucement. */
const embersLayer: Variants = {
  closed: { opacity: 0 },
  open: { opacity: [0, 1, 1, 0], transition: { duration: 4.5, times: [0, 0.08, 0.55, 1], ease: 'easeOut' } },
}

const textGroup: Variants = {
  closed: {},
  open: { transition: { delayChildren: TITLE_START + 0.25, staggerChildren: 0.11 } },
}

const eyebrow: Variants = {
  closed: { opacity: 0, letterSpacing: '0.5em', filter: 'blur(6px)' },
  open: {
    opacity: 1,
    letterSpacing: '0.18em',
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: EASE_OUT_EXPO, delay: TITLE_START - 0.2 },
  },
}

/** Lettre par lettre : sortie de derrière un cache, du flou au net. */
const letter: Variants = {
  closed: { y: '70%', opacity: 0, filter: 'blur(10px)' },
  open: (index: number) => ({
    y: '0%',
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE_OUT_EXPO, delay: TITLE_START + index * LETTER_GAP },
  }),
}

const riseIn: Variants = {
  closed: { opacity: 0, y: 16, filter: 'blur(6px)' },
  open: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
}

/** Reflet or qui balaie le bouton une fois posé. */
const buttonSheen: Variants = {
  closed: { x: '-120%' },
  open: { x: '230%', transition: { duration: 1, ease: 'easeInOut', delay: 0.7 } },
}

/** « Réduire les animations » : simple fondu, aucun flou, aucun mouvement. */
const fadeOnly: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.4 } },
}

/**
 * Hero « La mise au point ».
 * Pendant que le rideau de l'intro se lève, l'image fait sa mise au point (du flou chaud au net), les braises
 * de l'intro continuent de monter, un trait de lumière balaie le plat et le titre se dévoile lettre par lettre ;
 * le trait or se signe sous « Dakar. » avec une étincelle.
 * Au défilement, le hero se replie en carte arrondie et la vidéo recule ; tout suit la molette, donc au retour
 * il se déplie de lui-même, et la lumière repasse sur le plat quand on revient tout en haut.
 */
export function HeroCinematic({ onExploreMenu, isRevealed = true }: HeroCinematicProps) {
  const reduceMotion = useReducedMotion() ?? false
  const sectionRef = useRef<HTMLElement>(null)
  const opening = useOpeningStatus()
  const state = isRevealed ? 'open' : 'closed'
  const pick = (variants: Variants) => (reduceMotion ? fadeOnly : variants)

  // Retour en haut de page après être descendu : la lumière repasse et le trait or se signe de nouveau.
  const [lightPass, setLightPass] = useState(0)
  const hasLeftRef = useRef(false)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (reduceMotion) return
    if (progress > 0.9) hasLeftRef.current = true
    else if (progress < 0.12 && hasLeftRef.current) {
      hasLeftRef.current = false
      setLightPass((count) => count + 1)
    }
  })

  // Repli en carte au défilement (et dépli au retour), recul de la vidéo, texte qui s'éloigne dans le flou.
  const inset = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 4])
  const insetBottom = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 12])
  const radius = useTransform(scrollYProgress, [0, 0.35], reduceMotion ? [0, 0] : [0, 28])
  const clipPath = useMotionTemplate`inset(0% ${inset}% ${insetBottom}% ${inset}% round ${radius}px)`
  const videoScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 1.16])
  const videoY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ['0%', '0%'] : ['0%', '18%'])
  const contentY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -80])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], reduceMotion ? [1, 1] : [1, 0])
  const contentBlurPx = useTransform(scrollYProgress, [0, 0.7], reduceMotion ? [0, 0] : [0, 8])
  const contentFilter = useMotionTemplate`blur(${contentBlurPx}px)`

  return (
    <motion.section
      ref={sectionRef}
      aria-label="BMC Food, le tacos de Dakar"
      initial="closed"
      animate={state}
      style={{ clipPath }}
      className="relative isolate w-full overflow-hidden bg-bmc-black text-white"
    >
      {/* 1. VIDÉO : parallaxe au défilement, mise au point à l'entrée */}
      <motion.div aria-hidden="true" style={{ scale: videoScale, y: videoY }} className="absolute inset-0 -z-20 overflow-hidden bg-black">
        <motion.div variants={reduceMotion ? undefined : focusPull} className="size-full will-change-[filter,transform]">
          <LoopingFadeVideo src="/images/hero/bmc_video_hero.mp4" className="size-full object-cover object-center" />
        </motion.div>
      </motion.div>
      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          variants={warmVeil}
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_90%_at_70%_60%,rgba(252,184,0,0.55),rgba(207,74,8,0.35)_45%,rgba(12,12,13,0.6)_100%)] mix-blend-soft-light"
        />
      )}

      {/* 2. VOILES DE LISIBILITÉ */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-black/85 from-0% via-black/45 via-45% to-transparent to-85%" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-zinc-950 from-0% via-transparent via-35% to-transparent" />

      {/* 3. BRAISES (relais de l'intro) */}
      {!reduceMotion && (
        <motion.div aria-hidden="true" variants={embersLayer} className="pointer-events-none absolute inset-0 -z-10">
          <Embers variant="hero" rise={460} />
        </motion.div>
      )}

      {/* 4. TRAIT DE LUMIÈRE sur le plat (à l'entrée, puis à chaque retour en haut de page) */}
      {!reduceMotion && (
        <motion.div
          key={`lumiere-${lightPass}`}
          aria-hidden="true"
          initial={{ x: '-110%', opacity: 0 }}
          animate={isRevealed ? { x: '250%', opacity: [0, 1, 1, 0] } : undefined}
          transition={{ duration: lightPass === 0 ? 1.7 : 1.3, ease: EASE_IN_OUT, delay: lightPass === 0 ? 0.35 : 0, opacity: { times: [0, 0.15, 0.75, 1], duration: lightPass === 0 ? 1.7 : 1.3, delay: lightPass === 0 ? 0.35 : 0 } }}
          className="pointer-events-none absolute -inset-y-1/2 left-0 -z-10 w-[45%] rotate-[18deg] bg-linear-to-r from-transparent via-[rgba(255,228,160,0.32)] to-transparent mix-blend-overlay"
        />
      )}

      {/* 5. TEXTE */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, filter: contentFilter }}
        className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
      >
        <div className="max-w-2xl pl-3 text-left sm:pl-6 md:pl-10 lg:pl-12">
          <motion.p variants={pick(eyebrow)} className="text-xs font-semibold uppercase text-bmc-gold sm:text-sm">
            BMC Food · Dakar
          </motion.p>

          <h1
            aria-label={TITLE}
            className="mt-2.5 font-display text-3xl font-bold leading-[1.08] tracking-tight text-white sm:mt-3 sm:text-5xl lg:text-6xl"
          >
            {TITLE_WORDS.map(({ word, letters }, wordIndex) => {
              const isLast = wordIndex === TITLE_WORDS.length - 1
              return (
                <span key={word} aria-hidden="true" className="relative inline-block whitespace-nowrap pb-[0.1em] align-top">
                  {letters.map(({ char, index }) => (
                    <motion.span key={index} custom={index} variants={pick(letter)} className="inline-block">
                      {char}
                    </motion.span>
                  ))}
                  {!isLast && <span className="inline-block w-[0.26em]" />}
                  {isLast && <SignatureUnderline key={`signature-${lightPass}`} isRevealed={isRevealed} isReplay={lightPass > 0} reduceMotion={reduceMotion} />}
                </span>
              )
            })}
          </h1>

          <motion.div variants={reduceMotion ? fadeOnly : textGroup}>
            <motion.p variants={pick(riseIn)} className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-200 sm:text-base">
              Viandes marinées, frites fraîches et sauce fromagère maison. Préparé à la commande.
            </motion.p>

            <motion.div variants={pick(riseIn)} className="mt-5 flex w-full items-center sm:w-auto">
              <button
                type="button"
                onClick={onExploreMenu}
                className="group relative flex h-12 cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg bg-bmc-gold px-6 font-display text-sm font-semibold text-black transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold sm:px-8 sm:text-base"
              >
                {!reduceMotion && (
                  <motion.span
                    aria-hidden="true"
                    variants={buttonSheen}
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/60 to-transparent"
                  />
                )}
                <span className="relative">Voir la carte</span>
                <ArrowRight className="relative size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </motion.div>

            {/* Statut en direct, à l'heure de Dakar */}
            <motion.div variants={pick(riseIn)} className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300 sm:text-sm">
              <span className="flex items-center gap-2">
                <span className="relative flex size-2">
                  {opening.isOpen && !reduceMotion && <span className="absolute inset-0 animate-ping rounded-full bg-bmc-success opacity-60" />}
                  <span className={`relative size-2 rounded-full ${opening.isOpen ? 'bg-bmc-success' : 'bg-bmc-gold'}`} />
                </span>
                <span className="font-medium text-white">{opening.isOpen ? "Ouvert jusqu'à 02h" : `Fermé · réouverture ${opening.reopensLabel}`}</span>
              </span>
              <span className="text-zinc-400">{OPENING_HOURS_LABEL}</span>
              <span className="text-zinc-200">Livraison à Dakar</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

    </motion.section>
  )
}

/**
 * Trait or sous « Dakar. », tracé de gauche à droite par une petite étincelle : la signature du titre.
 * Remonté (nouvelle clé) à chaque retour en haut de page pour se signer de nouveau.
 */
function SignatureUnderline({ isRevealed, isReplay, reduceMotion }: { isRevealed: boolean; isReplay: boolean; reduceMotion: boolean }) {
  const delay = isReplay ? 0.25 : TITLE_START + TITLE.length * LETTER_GAP + 0.15
  const animate = isRevealed ? 'open' : 'closed'
  if (reduceMotion) {
    return <span className="absolute bottom-[0.04em] left-0 h-[0.07em] w-[calc(100%_-_0.3em)] rounded-full bg-bmc-gold" />
  }
  return (
    <motion.span initial="closed" animate={animate} className="absolute bottom-[0.04em] left-0 h-[0.07em] w-[calc(100%_-_0.3em)]">
      <motion.span
        variants={{ closed: { scaleX: 0 }, open: { scaleX: 1, transition: { duration: 0.75, ease: EASE_IN_OUT, delay } } }}
        className="absolute inset-0 origin-left rounded-full bg-bmc-gold"
      />
      <motion.span
        variants={{
          closed: { left: '0%', opacity: 0 },
          open: { left: '100%', opacity: [0, 1, 1, 0], transition: { duration: 0.75, ease: EASE_IN_OUT, delay, opacity: { times: [0, 0.1, 0.8, 1], duration: 0.95, delay } } },
        }}
        className="absolute top-1/2 size-[0.3em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#fffbe8_0%,rgba(252,184,0,0.9)_40%,rgba(252,184,0,0)_72%)]"
      />
    </motion.span>
  )
}
