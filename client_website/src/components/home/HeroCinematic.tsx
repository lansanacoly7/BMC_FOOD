import { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, UtensilsCrossed, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface HeroCinematicProps {
  onExploreMenu: () => void
  onOrderNow?: () => void
}

interface HeroScene {
  id: string
  src: string
  alt: string
  badge: string
  titlePrimary: string
  titleHighlight: string
  titleSuffix: string
  description: string
  label: string
}

const HERO_SCENES: HeroScene[] = [
  {
    id: 'cheeseburger',
    src: '/images/hero/hero_cheeseburger.webp',
    alt: 'Cheeseburger Gourmet BMC Food reposant sur planche en ardoise',
    badge: 'BURGER GOURMET · FLAMMES & SAVEURS',
    titlePrimary: 'Le Gourmet Burger',
    titleHighlight: 'Saisi à la Flamme',
    titleSuffix: 'Et Cheddar Fondant.',
    description:
      'Steaks pur bœuf saisis à la flamme, cheddar fondant coulant et pain brioché toasté minute. L’excellence du fast-food artisanal à Dakar.',
    label: 'Burger Gourmet',
  },
  {
    id: 'taco_slice',
    src: '/images/hero/hero_taco_slice.webp',
    alt: 'Découpe nette au couteau de chef du French Tacos Pané Croustillant',
    badge: 'TACOS SIGNATURE · CROUSTILLANT D’OR',
    titlePrimary: 'Le French Tacos',
    titleHighlight: 'Pané & Découpé',
    titleSuffix: 'Minute au Couteau.',
    description:
      'Découpe nette révélant un cœur fondant généreux : viandes marinées, frites fraîches et sauce fromagère signature maison.',
    label: 'Tacos Pané',
  },
  {
    id: 'cheddar_pour',
    src: '/images/hero/hero_cheddar_pour.webp',
    alt: 'Coulée ultra gourmande de sauce cheddar chaude fondue sur spécialités BMC',
    badge: 'ONCTUOSITÉ SUPRÊME · CHEDDAR CHAUD',
    titlePrimary: 'L’Avalanche De',
    titleHighlight: 'Cheddar Coulant',
    titleSuffix: 'Sur Vos Favoris.',
    description:
      'Notre sauce fromagère fondante nappée généreusement à la commande. Un plaisir réconfortant et ultra gourmand à chaque bouchée.',
    label: 'Cheddar Fondu',
  },
  {
    id: 'crispy_chicken',
    src: '/images/hero/hero_crispy_chicken.webp',
    alt: 'Poulet frit ultra crispy pané et frites dorées croustillantes',
    badge: 'CRISPY SUPRÊME · RECETTE SECRÈTE',
    titlePrimary: 'Poulet Frit Ultra',
    titleHighlight: 'Crispy & Doré',
    titleSuffix: 'Aux Frites Chaudes.',
    description:
      'Marinade secrète aux épices douces, panure dorée extra croustillante et frites chaudes savoureuses. Préparé minute.',
    label: 'Poulet Crispy',
  },
]

const SCENE_DURATION_MS = 6000

/**
 * Hero Cinématique BMC Food — Version 4 Scènes WebP Animées (Maimouna Sall) :
 * - Intègre les 4 animations WebP légères créées par Maimouna Sall
 * - Rotation automatique toutes les 6 secondes avec fondu enchaîné doux
 * - Navigation interactive par puces Or au bas du Hero
 * - Décalage maîtrisé du bloc texte à droite pour sublimer le visuel
 */
export function HeroCinematic({ onExploreMenu }: HeroCinematicProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Rotation automatique en boucle
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_SCENES.length)
    }, SCENE_DURATION_MS)
    return () => clearInterval(timer)
  }, [isPaused])

  const activeScene = HERO_SCENES[currentIdx]

  return (
    <section
      aria-label="Hero Signature BMC Food - Scènes Animées"
      className="relative isolate w-full overflow-hidden bg-black text-white group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 
        1. BACKGROUND ANIMÉ WEBP (4 SCÈNES CRÉÉES PAR MAIMOUNA SALL EN FONDU ENCHAÎNÉ)
      */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden bg-black">
        <AnimatePresence mode="sync">
          <motion.img
            key={activeScene.id}
            src={activeScene.src}
            alt={activeScene.alt}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: 'easeInOut' }}
            className="absolute inset-0 size-full object-cover object-center filter contrast-105"
            loading="eager"
          />
        </AnimatePresence>
      </div>

      {/* 
        2. DÉGRADÉ LATÉRAL CINÉMA (SCRIM)
        Voile sombre progressif à gauche sous le texte, laissant l'animation totalement visible à droite
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/95 via-black/70 to-black/15 sm:w-4/5 lg:w-3/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black via-transparent to-black/35"
      />

      {/* 
        3. CONTENU TEXTE ÉQUILIBRÉ & CALIBRÉ UI/UX MOBILE & DESKTOP (LÉGÈREMENT DÉCALÉ À DROITE)
      */}
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="max-w-2xl text-left pl-3 sm:pl-6 md:pl-10 lg:pl-12">
          {/* Sur-titre Or officiel BMC FOOD dynamique par scène */}
          <motion.div
            key={`badge-${activeScene.id}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] sm:tracking-[0.25em] text-bmc-gold"
          >
            <Sparkles className="size-3 sm:size-3.5 text-bmc-gold" />
            <span>{activeScene.badge}</span>
          </motion.div>

          {/* Grand Titre proportionné avec animation douce au changement de scène */}
          <motion.h1
            key={`title-${activeScene.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-2.5 sm:mt-3 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.08] sm:leading-[1.04]"
          >
            {activeScene.titlePrimary} <br />
            <span className="bg-gradient-to-r from-bmc-gold via-amber-200 to-amber-500 bg-clip-text text-transparent">
              {activeScene.titleHighlight}
            </span>{' '}
            {activeScene.titleSuffix}
          </motion.h1>

          {/* Descriptif gourmand synchronisé avec la spécialité à l'écran */}
          <motion.p
            key={`desc-${activeScene.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-2.5 sm:mt-3.5 max-w-lg text-xs sm:text-sm lg:text-base text-zinc-200 font-normal leading-relaxed min-h-[48px] sm:min-h-[56px]"
          >
            {activeScene.description}
          </motion.p>

          {/* Bouton d'Action Unique Or brossé : « Explorer le Menu » */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 sm:mt-5 flex items-center w-full sm:w-auto"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onExploreMenu}
              aria-label="Explorer le menu BMC Food"
              className="h-11 sm:h-13 px-5 sm:px-8 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-bmc-gold/30 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap"
            >
              <UtensilsCrossed className="size-3.5 sm:size-4 text-black stroke-[2.5] shrink-0" />
              <span>Explorer le Menu</span>
              <ArrowRight className="size-3.5 sm:size-4 text-black stroke-[2.5] shrink-0" />
            </motion.button>
          </motion.div>

          {/* Horaires et livraison discrets */}
          <div className="mt-4 sm:mt-5 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-zinc-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 sm:size-3.5 text-bmc-gold" />
              <span>Ouvert 11h – 02h (7j/7)</span>
            </div>
            <span className="size-1 rounded-full bg-zinc-500" />
            <span className="text-zinc-200">Livraison express Dakar</span>
          </div>
        </div>
      </div>

      {/* 
        4. CONTRÔLE & INDICATEURS DE SCÈNE INTERACTIFS EN BAS À DROITE
      */}
      <div className="absolute right-4 sm:right-8 lg:right-12 bottom-6 sm:bottom-8 z-20 flex items-center gap-2">
        {HERO_SCENES.map((scene, idx) => {
          const isActive = idx === currentIdx
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              aria-label={`Afficher la scène : ${scene.label}`}
              className="group/indicator flex items-center gap-1.5 cursor-pointer p-1"
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  isActive
                    ? 'w-7 sm:w-9 bg-gradient-to-r from-bmc-gold to-amber-400 shadow-md shadow-amber-500/50'
                    : 'w-2 sm:w-2.5 bg-white/30 hover:bg-white/60'
                }`}
              />
              <span
                className={`hidden xl:inline text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300 ${
                  isActive ? 'text-amber-300 opacity-100' : 'opacity-0 group-hover/indicator:opacity-70 text-zinc-400'
                }`}
              >
                {isActive ? scene.label : ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* 
        5. DÉGRADÉ FONDU PROGRESSIF EN BAS (TRANSMISSION FLUIDE VERS LE RESTE DE LA PAGE)
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-zinc-950"
      />
    </section>
  )
}
