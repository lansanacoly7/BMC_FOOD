import { Sparkles, ArrowRight, UtensilsCrossed, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'

interface HeroCinematicProps {
  onExploreMenu: () => void
  onOrderNow?: () => void
}

interface HeroMediaItem {
  id: string
  title: string
  type: 'video' | 'gif'
  src: string
}

/**
 * Playlist officielle des scènes publicitaires du Hero BMC Food :
 * Validée par Maimouna Sall (rotation en fondu enchaîné de 6s).
 */
const HERO_PLAYLIST: HeroMediaItem[] = [
  {
    id: 'video-official',
    title: 'Spot Officiel BMC Food',
    type: 'video',
    src: '/images/hero/bmc_video_hero.mp4',
  },
  {
    id: 'burger-cinematic',
    title: 'Burger Gourmet BMC Complet',
    type: 'gif',
    src: '/images/hero/hero_burger_cinematic.gif',
  },
  {
    id: 'tacos-knife-slice',
    title: 'Tacos Pané Croustillant',
    type: 'gif',
    src: '/images/hero/tacos_knife_crispy.gif',
  },
  {
    id: 'tacos-cheese-flow',
    title: 'Sauce Fromagère Onctueuse',
    type: 'gif',
    src: '/images/hero/hero_tacos_cheese.gif',
  },
]

/**
 * Hero Cinématique BMC Food — Version Playlist Animée Multi-Vidéos/GIFs
 * - Rotation automatique toutes les 6 secondes avec fondu enchaîné doux (Cross-Fade)
 * - Arrière-plan plein écran sans cadre
 * - Voile dégradé protecteur à GAUCHE pour assurer la parfaite lisibilité des textes
 * - Bouton unique Or brossé « Explorer le Menu »
 * - Indicateurs discrets en bas à droite pour prévisualiser ou changer de scène
 */
export function HeroCinematic({ onExploreMenu }: HeroCinematicProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Rotation automatique toutes les 6 secondes avec pause si l'onglet est inactif
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        setCurrentIndex((prev) => (prev + 1) % HERO_PLAYLIST.length)
      }
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  const currentMedia = HERO_PLAYLIST[currentIndex]

  return (
    <section
      aria-label="Hero Signature BMC Food"
      className="relative isolate w-full overflow-hidden bg-black text-white"
    >
      {/* 
        1. ARRIÈRE-PLAN MULTI-MÉDIAS ANIMÉ (VIDÉO + GIFS EN FONDU ENCHAÎNÉ)
      */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMedia.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="size-full"
          >
            {currentMedia.type === 'video' ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="size-full object-cover object-center filter contrast-105"
              >
                <source src={currentMedia.src} type="video/mp4" />
              </video>
            ) : (
              <img
                src={currentMedia.src}
                alt={currentMedia.title}
                className="size-full object-cover object-center filter contrast-105"
                loading="eager"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 
        2. DÉGRADÉ LATÉRAL CINÉMA (SCRIM)
        Voile sombre progressif à gauche sous le texte pour lisibilité 100% garantie
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
        3. CONTENU TEXTE ÉQUILIBRÉ & CALIBRÉ UI/UX MOBILE & DESKTOP
      */}
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="max-w-2xl text-left">
          {/* Sur-titre Or officiel BMC FOOD */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] sm:tracking-[0.25em] text-bmc-gold"
          >
            <Sparkles className="size-3 sm:size-3.5 text-bmc-gold" />
            <span>BMC FOOD · SAVEURS SIGNATURES</span>
          </motion.div>

          {/* Grand Titre proportionné */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-2.5 sm:mt-3 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.08] sm:leading-[1.04]"
          >
            La Révolution <br />
            <span className="bg-gradient-to-r from-bmc-gold via-amber-200 to-amber-500 bg-clip-text text-transparent">
              Culinaire
            </span>{' '}
            Est Arrivée.
          </motion.h1>

          {/* Descriptif signature */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-2.5 sm:mt-3.5 max-w-lg text-xs sm:text-sm lg:text-base text-zinc-200 font-normal leading-relaxed"
          >
            L'incontournable <strong className="font-bold text-white">Tacos de Dakar</strong> : viandes marinées savoureuses, frites fraîches et sauce fromagère onctueuse maison. Préparé à la commande.
          </motion.p>

          {/* Bouton d'Action Unique Or brossé : « Explorer le Menu » */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-4 sm:mt-5 flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-zinc-300 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 sm:size-3.5 text-bmc-gold" />
              <span>Ouvert 11h – 02h (7j/7)</span>
            </div>
            <span className="size-1 rounded-full bg-zinc-500" />
            <span className="text-zinc-200">Livraison express Dakar</span>
          </motion.div>
        </div>
      </div>

      {/* 
        4. INDICATEURS DE SCÈNES DISCRETS (DARK LUXURY)
        Permet de voir et basculer interactivement entre les scènes vidéo/GIF
      */}
      <div
        aria-label="Contrôles des scènes publicitaires"
        className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-10 flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md border border-white/10"
      >
        {HERO_PLAYLIST.map((item, idx) => {
          const isActive = idx === currentIndex
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Afficher la scène : ${item.title}`}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                isActive
                  ? 'w-6 sm:w-8 bg-gradient-to-r from-bmc-gold to-amber-400 shadow-sm shadow-bmc-gold/50'
                  : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          )
        })}
      </div>

      {/* 
        5. DÉGRADÉ FONDU PROGRESSIF EN BAS
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-zinc-950"
      />
    </section>
  )
}
