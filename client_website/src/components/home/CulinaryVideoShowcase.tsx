import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface CulinaryVideoShowcaseProps {
  onExploreMenu: () => void
}

interface CulinaryScene {
  id: string
  title: string
  badge: string
  src: string
  poster: string
}

/**
 * 5 Scènes Vidéo Cinématiques BMC Food (générées avec Veo / Gemini) :
 * 1. Découpe croustillante au couteau (Tacos pané rectangulaire)
 * 2. Cheese-pull & cœur fondant à deux mains
 * 3. Nappage coulant de sauce fromagère
 * 4. Cheeseburger gourmet saisi sur ardoise
 * 5. Spot publicitaire d'ambiance BMC Food
 */
const CULINARY_SCENES: CulinaryScene[] = [
  {
    id: 'knife_slice',
    title: 'Découpe Croustillante',
    badge: 'Tacos Pané Signature',
    src: '/videos/culinary/scene_1_knife_slice.mp4',
    poster: '/images/hero/tacos_pane_knife_cut.jpg',
  },
  {
    id: 'cheese_pull',
    title: 'Cheese-Pull & Cœur Fondant',
    badge: 'Gourmandise Maximale',
    src: '/videos/culinary/scene_2_cheese_pull.mp4',
    poster: '/images/hero/tacos_pane_knife_cut.jpg',
  },
  {
    id: 'cheese_pour',
    title: 'Nappage Sauce Fromagère',
    badge: 'Recette Secrète Onctueuse',
    src: '/videos/culinary/scene_3_cheese_pour.mp4',
    poster: '/images/hero/tacos_pane_knife_cut.jpg',
  },
  {
    id: 'cheeseburger',
    title: 'Cheeseburger Saisi',
    badge: 'Burger Gourmet Dakar',
    src: '/videos/culinary/scene_4_cheeseburger.mp4',
    poster: '/images/hero/tacos_pane_knife_cut.jpg',
  },
  {
    id: 'commercial',
    title: "L'Expérience BMC Food",
    badge: 'Le Vrai Goût du Plaisir',
    src: '/videos/culinary/scene_5_commercial.mp4',
    poster: '/images/hero/tacos_pane_knife_cut.jpg',
  },
]

const SCENE_DURATION_MS = 4500

/**
 * Capsule Vidéo Culinaire Multi-Scènes Automatique BMC Food :
 * - Carrousel vidéo fluide avec fondu enchaîné (cross-fade)
 * - Indicateurs de progression interactifs (style Stories)
 * - Défilement automatique toutes les 4,5s avec pause au survol
 * - Zéro chargement lourd : lecture optimisée native MP4
 */
export function CulinaryVideoShowcase({ onExploreMenu }: CulinaryVideoShowcaseProps) {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const currentScene = CULINARY_SCENES[activeSceneIndex]

  const goToNext = useCallback(() => {
    setActiveSceneIndex((prev) => (prev + 1) % CULINARY_SCENES.length)
  }, [])

  // Défilement automatique des scènes
  useEffect(() => {
    if (!isPlaying || isHovered) return

    const timer = setInterval(() => {
      goToNext()
    }, SCENE_DURATION_MS)

    return () => clearInterval(timer)
  }, [isPlaying, isHovered, goToNext, activeSceneIndex])

  // Lancement automatique de la vidéo active
  useEffect(() => {
    const currentVideo = videoRefs.current[activeSceneIndex]
    if (currentVideo) {
      currentVideo.currentTime = 0
      if (isPlaying) {
        currentVideo.play().catch(() => {
          // Lecture automatique muette de secours acceptée par tous les navigateurs
        })
      }
    }
  }, [activeSceneIndex, isPlaying])

  const togglePlay = () => {
    const currentVideo = videoRefs.current[activeSceneIndex]
    if (!currentVideo) return

    if (isPlaying) {
      currentVideo.pause()
      setIsPlaying(false)
    } else {
      currentVideo.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    videoRefs.current.forEach((video) => {
      if (video) video.muted = nextMuted
    })
  }

  return (
    <section
      aria-labelledby="culinary-showcase-title"
      className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/80 to-zinc-950 pt-10 sm:pt-14 pb-4 sm:pb-6 border-t border-white/5"
    >
      {/* Halo d'ambiance or Dark Luxury en arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-amber-500/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* EN-TÊTE DE LA SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-bmc-gold backdrop-blur-sm"
          >
            <Sparkles className="size-3.5 text-bmc-gold animate-pulse" />
            <span>Savoir-Faire Artisanal BMC</span>
          </motion.div>

          <motion.h2
            id="culinary-showcase-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight"
          >
            L'Art du{' '}
            <span className="bg-gradient-to-r from-amber-300 via-bmc-gold to-amber-500 bg-clip-text text-transparent">
              Tacos Pané
            </span>{' '}
            à Dakar
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-xs sm:text-sm text-zinc-300 max-w-2xl mx-auto leading-relaxed"
          >
            Découvrez nos 5 scènes cinématiques : découpe croustillante au couteau, cheese-pull fondant et sauces onctueuses préparées à la commande.
          </motion.p>
        </div>

        {/* CADRE VIDÉO CINÉMATIQUE MULTI-SCÈNES (Carrousel automatique) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-amber-500/30 bg-black shadow-[0_0_50px_rgba(252,184,0,0.14)] group"
        >
          {/* PETITS DOTS DE NAVIGATION DISCRETS SUR LA GAUCHE (Style Best-Sellers) */}
          <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-30 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1.5 border border-white/10">
            {CULINARY_SCENES.map((scene, idx) => {
              const isActive = idx === activeSceneIndex
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'w-5 sm:w-6 bg-gradient-to-r from-bmc-gold to-amber-400 shadow-sm shadow-bmc-gold/50'
                      : 'w-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Aller à la scène ${idx + 1}: ${scene.title}`}
                />
              )
            })}
          </div>

          {/* CONTENEUR DE LA VIDÉO ACTIVE */}
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 size-full"
              >
                <video
                  ref={(el) => {
                    videoRefs.current[activeSceneIndex] = el
                  }}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload={activeSceneIndex === 0 ? 'auto' : 'metadata'}
                  poster={currentScene.poster}
                  className="size-full object-cover object-center filter contrast-105"
                >
                  <source src={currentScene.src} type="video/mp4" />
                </video>
              </motion.div>
            </AnimatePresence>

            {/* Boutons de contrôle discrets en haut à droite (Play/Pause et Son/Mute) */}
            <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex items-center gap-1.5 z-20">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la vidéo'}
                className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-black/90 hover:border-bmc-gold hover:text-bmc-gold cursor-pointer"
              >
                {isPlaying ? <Pause className="size-3" /> : <Play className="size-3 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-black/90 hover:border-bmc-gold hover:text-bmc-gold cursor-pointer"
              >
                {isMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3 text-bmc-gold" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* BOUTON D'ACTION (Compact sur mobile, Somptueux et grand sur desktop) */}
        <div className="mt-5 sm:mt-7 text-center space-y-2">
          <motion.button
            type="button"
            onClick={onExploreMenu}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex items-center gap-2 sm:gap-3 rounded-full bg-gradient-to-r from-amber-400 via-bmc-gold to-amber-500 px-5 sm:px-8 py-2 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-md shadow-bmc-gold/20 sm:shadow-[0_10px_30px_rgba(252,184,0,0.35)] transition-all cursor-pointer hover:shadow-lg sm:hover:shadow-[0_15px_40px_rgba(252,184,0,0.5)] hover:brightness-105"
          >
            <span className="sm:hidden">Voir la Carte</span>
            <span className="hidden sm:inline">Découvrir la Carte & Commander</span>
            <ArrowRight className="size-3.5 sm:size-4 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </div>
    </section>
  )
}
