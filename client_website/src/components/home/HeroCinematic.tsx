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
  // Textes courts et percutants pour mobile (Directive Maimouna Sall)
  mobileTitle: string
  mobileHighlight: string
  mobileSubtitle: string
}

const HERO_SCENES: HeroScene[] = [
  {
    id: 'cheeseburger',
    src: '/images/hero/hero_cheeseburger.webp',
    alt: 'Cheeseburger Gourmet BMC Food reposant sur planche en ardoise',
    badge: 'BURGER GOURMET',
    titlePrimary: 'Le Gourmet Burger',
    titleHighlight: 'Saisi à la Flamme',
    titleSuffix: 'Et Cheddar Fondant.',
    description:
      'Steaks pur bœuf saisis à la flamme, cheddar fondant coulant et pain brioché toasté minute. L’excellence du fast-food artisanal à Dakar.',
    label: 'Burger Gourmet',
    mobileTitle: 'Gourmet Burger',
    mobileHighlight: 'Cheddar Fondant',
    mobileSubtitle: 'Steaks saisis à la flamme & pain brioché.',
  },
  {
    id: 'taco_slice',
    src: '/images/hero/hero_taco_slice.webp',
    alt: 'Découpe nette au couteau de chef du French Tacos Pané Croustillant',
    badge: 'TACOS SIGNATURE',
    titlePrimary: 'Le French Tacos',
    titleHighlight: 'Pané & Découpé',
    titleSuffix: 'Minute au Couteau.',
    description:
      'Découpe nette révélant un cœur fondant généreux : viandes marinées, frites fraîches et sauce fromagère signature maison.',
    label: 'Tacos Pané',
    mobileTitle: 'Tacos Pané',
    mobileHighlight: 'Cœur Fondant',
    mobileSubtitle: 'Panure dorée croustillante découpée minute.',
  },
  {
    id: 'cheddar_pour',
    src: '/images/hero/hero_cheddar_pour.webp',
    alt: 'Coulée ultra gourmande de sauce cheddar chaude fondue sur spécialités BMC',
    badge: 'CHEDDAR COULANT',
    titlePrimary: 'L’Avalanche De',
    titleHighlight: 'Cheddar Coulant',
    titleSuffix: 'Sur Vos Favoris.',
    description:
      'Notre sauce fromagère fondante nappée généreusement à la commande. Un plaisir réconfortant et ultra gourmand à chaque bouchée.',
    label: 'Cheddar Fondu',
    mobileTitle: 'Cheddar Chaud',
    mobileHighlight: 'Coulée Généreuse',
    mobileSubtitle: 'Sauce fromagère fondante nappée minute.',
  },
  {
    id: 'crispy_chicken',
    src: '/images/hero/hero_crispy_chicken.webp',
    alt: 'Poulet frit ultra crispy pané et frites dorées croustillantes',
    badge: 'POULET CRISPY',
    titlePrimary: 'Poulet Frit Ultra',
    titleHighlight: 'Crispy & Doré',
    titleSuffix: 'Aux Frites Chaudes.',
    description:
      'Marinade secrète aux épices douces, panure dorée extra croustillante et frites chaudes savoureuses. Préparé minute.',
    label: 'Poulet Crispy',
    mobileTitle: 'Poulet Crispy',
    mobileHighlight: 'Frites Dorées',
    mobileSubtitle: 'Marinade secrète & panure extra croustillante.',
  },
]

const SCENE_DURATION_MS = 6000

/**
 * Hero Cinématique BMC Food — Version 4 Scènes WebP Animées (Maimouna Sall) :
 * - Mobile : Texte minimaliste et aéré pour laisser les animations WebP 100% visibles
 * - Desktop : Expérience cinématique complète avec rotation fluide et textes détaillés
 * - Rotation automatique toutes les 6 secondes avec pause au survol
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

  // Préchargement immédiat en cache de toutes les animations WebP
  useEffect(() => {
    HERO_SCENES.forEach((scene) => {
      const img = new Image()
      img.src = scene.src
    })
  }, [])

  const activeScene = HERO_SCENES[currentIdx]

  return (
    <section
      aria-label="Hero Signature BMC Food - Scènes Animées"
      className="relative isolate w-full overflow-hidden bg-black text-white group min-h-[320px] xs:min-h-[360px] sm:min-h-[420px] lg:min-h-[460px] flex items-center"
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
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="absolute inset-0 size-full object-cover object-center filter contrast-105"
            loading="eager"
          />
        </AnimatePresence>
      </div>

      {/* 
        2. DÉGRADÉ ADAPTATIF CINÉMA (SCRIM)
        - Sur Mobile : Dégradé doux vertical concentré en bas (laisse tout le centre/haut de l'image 100% visible)
        - Sur Desktop : Voile latéral gauche élégant laissant la vidéo libre à droite
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/45 to-transparent sm:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden sm:block bg-gradient-to-r from-black/95 via-black/70 to-black/15 sm:w-4/5 lg:w-3/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden sm:block bg-gradient-to-t from-black via-transparent to-black/35"
      />

      {/* 
        3. CONTENU TEXTE ÉQUILIBRÉ
        - Version Mobile : Minimaliste, court et discret pour maximiser la visibilité des animations WebP
        - Version Desktop : Riche, immersif avec décalage maîtrisé à droite
      */}
      <div className="relative w-full mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="max-w-2xl text-left pl-2 sm:pl-6 md:pl-10 lg:pl-12">
          
          {/* Sur-titre Or officiel */}
          <motion.div
            key={`badge-${activeScene.id}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.25em] text-bmc-gold"
          >
            <Sparkles className="size-2.5 sm:size-3.5 text-bmc-gold" />
            <span>BMC FOOD · {activeScene.badge}</span>
          </motion.div>

          {/* TITRE : Version Mobile minimaliste (< sm) */}
          <motion.h1
            key={`title-mobile-${activeScene.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="sm:hidden mt-1 font-display text-lg xs:text-xl font-extrabold uppercase tracking-tight text-white leading-tight"
          >
            {activeScene.mobileTitle}{' '}
            <span className="bg-gradient-to-r from-bmc-gold via-amber-200 to-amber-500 bg-clip-text text-transparent">
              {activeScene.mobileHighlight}
            </span>
          </motion.h1>

          {/* TITRE : Version Desktop (>= sm) */}
          <motion.h1
            key={`title-desktop-${activeScene.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="hidden sm:block mt-2.5 font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold uppercase tracking-tight text-white leading-[1.05]"
          >
            {activeScene.titlePrimary} <br />
            <span className="bg-gradient-to-r from-bmc-gold via-amber-200 to-amber-500 bg-clip-text text-transparent">
              {activeScene.titleHighlight}
            </span>{' '}
            {activeScene.titleSuffix}
          </motion.h1>

          {/* SOUS-TITRE : Version Mobile très courte (< sm) */}
          <motion.p
            key={`desc-mobile-${activeScene.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="sm:hidden mt-1 text-[11px] xs:text-xs text-zinc-300 font-medium leading-snug line-clamp-1"
          >
            {activeScene.mobileSubtitle}
          </motion.p>

          {/* SOUS-TITRE : Version Desktop (>= sm) */}
          <motion.p
            key={`desc-desktop-${activeScene.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="hidden sm:block mt-3 max-w-lg text-xs sm:text-sm lg:text-base text-zinc-200 font-normal leading-relaxed min-h-[48px]"
          >
            {activeScene.description}
          </motion.p>

          {/* Bouton d'Action Or : Format compact sur mobile, généreux sur desktop */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-3 sm:mt-5 flex items-center w-auto"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onExploreMenu}
              aria-label="Explorer le menu BMC Food"
              className="h-8 xs:h-9 sm:h-12 px-3.5 xs:px-4 sm:px-8 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-[10px] xs:text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-md sm:shadow-lg shadow-bmc-gold/30 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap"
            >
              <UtensilsCrossed className="size-3 sm:size-4 text-black stroke-[2.5] shrink-0" />
              <span>Explorer le Menu</span>
              <ArrowRight className="size-3 sm:size-4 text-black stroke-[2.5] shrink-0" />
            </motion.button>
          </motion.div>

          {/* Horaires et livraison discrets (Desktop uniquement pour ne pas surcharger le mobile) */}
          <div className="hidden sm:flex mt-4 flex-items-center gap-3 sm:gap-4 text-xs text-zinc-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-bmc-gold" />
              <span>Ouvert 11h – 02h (7j/7)</span>
            </div>
            <span className="size-1 rounded-full bg-zinc-500 my-auto" />
            <span className="text-zinc-200">Livraison express Dakar</span>
          </div>
        </div>
      </div>

      {/* 
        4. CONTRÔLE & INDICATEURS DE SCÈNE INTERACTIFS EN BAS À DROITE
      */}
      <div className="absolute right-3 sm:right-8 lg:right-12 bottom-3 sm:bottom-6 z-20 flex items-center gap-1.5 sm:gap-2">
        {HERO_SCENES.map((scene, idx) => {
          const isActive = idx === currentIdx
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              aria-label={`Afficher la scène : ${scene.label}`}
              className="group/indicator flex items-center gap-1.5 cursor-pointer p-0.5 sm:p-1"
            >
              <div
                className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${
                  isActive
                    ? 'w-5 sm:w-9 bg-gradient-to-r from-bmc-gold to-amber-400 shadow-md shadow-amber-500/50'
                    : 'w-1.5 sm:w-2.5 bg-white/30 hover:bg-white/60'
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
        5. DÉGRADÉ FONDU PROGRESSIF EN BAS
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 sm:h-20 bg-gradient-to-b from-transparent to-zinc-950"
      />
    </section>
  )
}
