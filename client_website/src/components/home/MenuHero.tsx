import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeroSlide {
  id: number
  eyebrow: string
  titleLine1: string
  titleLine2: string
  description: string
  ctaLabel: string
  image: string
  floatingBadge?: {
    sub: string
    value: string
  }
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    eyebrow: 'Tacos panés',
    titleLine1: 'Le tacos pané',
    titleLine2: 'de BMC Food',
    description:
      'Viande ou poulet, frites et sauce fromagère maison, dans une panure dorée.',
    ctaLabel: 'Voir la carte',
    image: '/images/hero/hero-banner-tacos.jpg',
    floatingBadge: {
      sub: 'À partir de',
      value: '3 500 F',
    },
  },
  {
    id: 2,
    eyebrow: 'Burgers',
    titleLine1: 'Les burgers',
    titleLine2: 'de la carte',
    description:
      'Steak de bœuf ou poulet crispy, fromage, salade et sauce.',
    ctaLabel: 'Voir les burgers',
    image: '/images/hero/hero-steaming-burger.jpg',
    floatingBadge: {
      sub: 'À partir de',
      value: '1 500 F',
    },
  },
  {
    id: 3,
    eyebrow: 'Poulet',
    titleLine1: 'Tenders',
    titleLine2: 'de poulet',
    description:
      'Aiguillettes de poulet marinées, panure croustillante aux épices douces.',
    ctaLabel: 'Voir la carte',
    image: '/images/hero/hero-banner-duo.jpg',
    floatingBadge: {
      sub: 'À partir de',
      value: '2 500 F',
    },
  },
]
/** Teinte du fond de page à une opacité donnée : le voile se fond dans la page en clair comme en sombre. */
const page = (opacity: number) => `color-mix(in oklab, var(--color-zinc-950) ${opacity}%, transparent)`

/** Dégradés à paliers progressifs (jamais de saut brutal d'opacité entre deux paliers). */
const SCRIM_FROM_LEFT = `linear-gradient(to right, ${page(94)} 0%, ${page(86)} 22%, ${page(70)} 40%, ${page(46)} 58%, ${page(22)} 76%, ${page(6)} 90%, transparent 100%)`
const SCRIM_FROM_BOTTOM = `linear-gradient(to top, ${page(100)} 0%, ${page(88)} 25%, ${page(58)} 50%, ${page(26)} 75%, transparent 100%)`
const SCRIM_FROM_TOP = `linear-gradient(to bottom, ${page(80)} 0%, ${page(46)} 40%, ${page(16)} 75%, transparent 100%)`

export interface MenuHeroProps {
  onExploreMenu: () => void
}

export function MenuHero({ onExploreMenu }: MenuHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Rotation automatique fluide toutes les 6,5 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 6500)
    return () => clearInterval(timer)
  }, [])

  const slide = HERO_SLIDES[currentSlide]

  return (
    <section
      aria-label="Présentation vedette BMC Food"
      className="relative w-full overflow-hidden bg-zinc-950 min-h-[380px] sm:min-h-[430px] lg:min-h-[480px] flex flex-col justify-between select-none"
    >
      {/* 1. IMAGE DE FOND PLEIN ÉCRAN */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="absolute inset-0 bg-cover bg-center lg:bg-[right_center]"
          style={{ backgroundImage: `url('${slide.image}')` }}
        />
      </AnimatePresence>

      {/* Voiles progressifs : plusieurs paliers pour que l'image apparaisse sans aucune coupure nette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: SCRIM_FROM_LEFT }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40"
        style={{ backgroundImage: SCRIM_FROM_BOTTOM }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ backgroundImage: SCRIM_FROM_TOP }}
      />

      {/* 2. CONTENU PRINCIPAL CENTRÉ PLEIN ÉCRAN */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 flex-1 flex flex-col justify-between">
        {/* LIGNE SUPÉRIEURE : Eyebrow à gauche + LE DÉFILEMENT (PAGINATION) À DROITE */}
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Eyebrow de la promotion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm font-medium text-bmc-gold">
                {slide.eyebrow}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* DÉFILEMENT EN HAUT À DROITE (Indicateurs Carrousel 🟡 ⚪ ⚪ ⚪ ⚪) */}
          <div
            role="tablist"
            aria-label="Navigation carrousel"
            className="flex items-center gap-2 sm:gap-2.5 rounded-full bg-black/60 px-3 py-1.5 border border-white/10"
          >
            {HERO_SLIDES.map((s, idx) => {
              const isActive = currentSlide === idx
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Slide ${idx + 1} : ${s.titleLine1}`}
                  className={`transition-all duration-300 cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'size-3 rounded-full bg-bmc-gold'
                      : 'size-2.5 rounded-full bg-white/50 hover:bg-white/80'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* CONTENU CENTRAL : Titre compact, Description et Bouton JAUNE UNIQUE */}
        <div className="my-auto max-w-xl text-left py-4 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-start gap-3 sm:gap-3.5"
            >
              {/* Titre percutant avec Or BMC */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                {slide.titleLine1} <br />
                <span className="inline-block mt-0.5 text-bmc-gold">
                  {slide.titleLine2}
                </span>
              </h1>

              <p className="max-w-md sm:max-w-lg text-sm sm:text-base text-zinc-300 leading-relaxed">
                {slide.description}
              </p>

              <div className="mt-1 flex items-center">
                <button
                  type="button"
                  onClick={onExploreMenu}
                  className="flex h-12 items-center gap-2 rounded-lg bg-bmc-gold hover:bg-amber-400 px-6 sm:px-8 font-display font-semibold text-sm sm:text-base text-black transition-colors cursor-pointer"
                >
                  <span>{slide.ctaLabel}</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* LIGNE INFÉRIEURE : Flèches de navigation et Badge prix */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentSlide(
                  (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
                )
              }
              aria-label="Slide précédent"
              className="flex size-8 sm:size-9 items-center justify-center rounded-full border border-white/20 bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer hover:border-white/50"
            >
              <ChevronLeft className="size-4.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
              }
              aria-label="Slide suivant"
              className="flex size-8 sm:size-9 items-center justify-center rounded-full border border-white/20 bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer hover:border-white/50"
            >
              <ChevronRight className="size-4.5" />
            </button>
          </div>

          {slide.floatingBadge && (
            <motion.div
              key={`badge-${slide.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2.5 rounded-lg bg-black/65 border border-white/10 px-3.5 py-1.5 text-right"
            >
              <div className="flex flex-col">
                <span className="text-xs text-zinc-400">
                  {slide.floatingBadge.sub}
                </span>
                <span className="font-display text-sm font-bold text-bmc-gold">
                  {slide.floatingBadge.value}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
