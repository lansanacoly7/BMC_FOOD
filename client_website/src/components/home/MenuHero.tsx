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
    eyebrow: 'Obtenez une remise spéciale',
    titleLine1: 'Réduction de 25%',
    titleLine2: 'sur le Menu Duo',
    description:
      'Burger gourmet au choix, tenders dorés croustillants et frites fraîches maison. Le vrai goût du partage chez BMC Dakar !',
    ctaLabel: 'Réclamer mon bon',
    image: '/images/hero/hero-steaming-burger.jpg',
    floatingBadge: {
      sub: 'Menu Duo dès',
      value: '6 500 F',
    },
  },
  {
    id: 2,
    eyebrow: 'Spécialité Signature BMC',
    titleLine1: 'Le vrai goût',
    titleLine2: 'des Tacos Panés',
    description:
      'Nos tacos signatures entièrement panés et dorés à la main : fromage coulant maison, viandes assaisonnées et frites croustillantes.',
    ctaLabel: 'Découvrir la carte',
    image: '/images/hero/hero-banner-tacos.jpg',
    floatingBadge: {
      sub: 'À partir de',
      value: '3 500 F',
    },
  },
  {
    id: 3,
    eyebrow: 'Bœuf Smashé Minute',
    titleLine1: 'Smash Burger',
    titleLine2: 'Double Cheddar & Bacon',
    description:
      'Steaks saisis à la minute sur plaque brûlante, sauce secrète BMC et pain brioché artisanal aux graines de sésame torréfiées.',
    ctaLabel: 'Commander ce burger',
    image: '/images/hero/hero-steaming-burger.jpg',
    floatingBadge: {
      sub: 'Cheddar fondant',
      value: '4 500 F',
    },
  },
  {
    id: 4,
    eyebrow: 'Le Goût du Partage',
    titleLine1: 'Le Croustillant',
    titleLine2: "Chicken Tenders d'Or",
    description:
      'Filets de poulet marinés aux épices douces, panure dorée extra-craquante servie avec notre sauce fromagère signature maison.',
    ctaLabel: 'Goûter au croustillant',
    image: '/images/hero/hero-banner-duo.jpg',
    floatingBadge: {
      sub: 'Panure dorée',
      value: '4 000 F',
    },
  },
  {
    id: 5,
    eyebrow: 'Ouvert 7j/7 de 11h à 02h',
    titleLine1: 'Pack BMC Box',
    titleLine2: 'Pour 2 à 4 personnes',
    description:
      'Tacos panés, burgers, wings BBQ, frites fraîches et rafraîchissements. Votre festin livré bien chaud partout à Dakar.',
    ctaLabel: 'Commander le pack',
    image: '/images/hero/hero-banner-duo.jpg',
    floatingBadge: {
      sub: 'Formule groupe',
      value: '12 500 F',
    },
  },
]

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
      className="relative w-full overflow-hidden bg-[#0C0C0D] min-h-[380px] sm:min-h-[430px] lg:min-h-[480px] flex flex-col justify-between select-none"
    >
      {/* 1. IMAGE DE FOND PLEIN ÉCRAN */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="absolute inset-0 bg-cover bg-center lg:bg-[right_center]"
          style={{ backgroundImage: `url('${slide.image}')` }}
        />
      </AnimatePresence>

      {/* Dégradés cinématiques compacts pour contraste maximal */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0C0C0D] via-[#0C0C0D]/90 to-transparent sm:via-[#0C0C0D]/80 lg:from-[#0C0C0D] lg:via-[#0C0C0D]/70 lg:to-transparent lg:to-[58%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0C0C0D] via-[#0C0C0D]/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0C0C0D]/80 to-transparent"
      />

      {/* 2. CONTENU PRINCIPAL CENTRÉ PLEIN ÉCRAN */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 flex-1 flex flex-col justify-between">
        {/* LIGNE SUPÉRIEURE : Eyebrow à gauche + LE DÉFILEMENT (PAGINATION) À DROITE */}
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Eyebrow de la promotion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <span className="flex size-2 rounded-full bg-bmc-gold animate-pulse" />
              <span className="text-xs sm:text-sm font-bold tracking-wide text-zinc-300 uppercase">
                {slide.eyebrow}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* DÉFILEMENT EN HAUT À DROITE (Indicateurs Carrousel 🟡 ⚪ ⚪ ⚪ ⚪) */}
          <div
            role="tablist"
            aria-label="Navigation carrousel"
            className="flex items-center gap-2 sm:gap-2.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10"
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
                      ? 'size-3.5 sm:size-4 rounded-full ring-2 ring-bmc-gold ring-offset-2 ring-offset-black bg-bmc-gold shadow-[0_0_12px_rgba(252,184,0,0.8)]'
                      : 'size-2 sm:size-2.5 rounded-full bg-white/70 hover:bg-white hover:scale-125'
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
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-start gap-3 sm:gap-3.5"
            >
              {/* Titre percutant avec Or BMC */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">
                {slide.titleLine1} <br />
                <span className="inline-block mt-0.5 text-bmc-gold font-display font-black">
                  {slide.titleLine2}
                </span>
              </h1>

              {/* Description soignée */}
              <p className="max-w-md sm:max-w-lg text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {slide.description}
              </p>

              {/* BOUTON UNIQUE EN JAUNE (Or BMC #FCB800) */}
              <div className="mt-1 flex items-center">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onExploreMenu}
                  className="flex items-center gap-2 rounded-xl sm:rounded-2xl bg-bmc-gold hover:bg-yellow-400 px-7 sm:px-9 py-3 sm:py-3.5 font-display font-black text-xs sm:text-sm text-black shadow-[0_6px_25px_rgba(252,184,0,0.4)] transition-all cursor-pointer"
                >
                  <span>{slide.ctaLabel}</span>
                  <ArrowRight className="size-4.5 stroke-[3]" />
                </motion.button>
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2.5 rounded-xl bg-black/65 backdrop-blur-md border border-zinc-700/80 px-3.5 py-1.5 text-right"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {slide.floatingBadge.sub}
                </span>
                <span className="font-display text-xs sm:text-sm font-black text-bmc-gold tracking-tight">
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
