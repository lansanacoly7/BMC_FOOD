import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Flame,
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

  const goToPrev = useCallback(() => {
    setActiveSceneIndex((prev) => (prev - 1 + CULINARY_SCENES.length) % CULINARY_SCENES.length)
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
          {/* BARRES DE PROGRESSION ÉLÉGANTES (Style Stories Instagram) */}
          <div className="absolute top-3 left-4 right-4 z-30 flex items-center gap-1.5 sm:gap-2">
            {CULINARY_SCENES.map((scene, idx) => {
              const isActive = idx === activeSceneIndex
              const isPast = idx < activeSceneIndex
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneIndex(idx)}
                  className="flex-1 h-1 sm:h-1.5 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm cursor-pointer transition-all hover:h-2"
                  aria-label={`Aller à la scène ${idx + 1}: ${scene.title}`}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-400 to-bmc-gold w-full'
                        : isPast
                        ? 'bg-white/80 w-full'
                        : 'w-0'
                    }`}
                  />
                </button>
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

            {/* Voiles dégradés protecteurs haut et bas */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10"
            />

            {/* Flèche Gauche (Précédent) */}
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Scène précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90 hover:border-bmc-gold hover:text-bmc-gold cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>

            {/* Flèche Droite (Suivant) */}
            <button
              type="button"
              onClick={goToNext}
              aria-label="Scène suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90 hover:border-bmc-gold hover:text-bmc-gold cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Boutons de contrôle (Play/Pause et Son/Mute) */}
            <div className="absolute top-7 right-4 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la vidéo'}
                className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-black/90 hover:border-bmc-gold hover:text-bmc-gold cursor-pointer"
              >
                {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                className="flex size-8 sm:size-9 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-black/90 hover:border-bmc-gold hover:text-bmc-gold cursor-pointer"
              >
                {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5 text-bmc-gold" />}
              </button>
            </div>

            {/* Badges descriptifs en temps réel au bas de la vidéo */}
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-20">
              <div className="flex items-center gap-2 rounded-full bg-black/75 backdrop-blur-md border border-white/15 px-3 py-1 text-xs text-white font-medium">
                <ChefHat className="size-3.5 text-bmc-gold shrink-0" />
                <span className="font-bold text-white">{currentScene.title}</span>
                <span className="text-zinc-400 text-[11px] hidden xs:inline">· {currentScene.badge}</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 px-3 py-1 text-[11px] font-black text-bmc-gold uppercase tracking-wider">
                <Flame className="size-3 text-amber-400" />
                <span>Scène {activeSceneIndex + 1}/{CULINARY_SCENES.length}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* BOUTON D'ACTION REMONTÉ DIRECTEMENT SOUS LA VIDÉO */}
        <div className="mt-6 sm:mt-8 text-center space-y-2.5">
          <motion.button
            type="button"
            onClick={onExploreMenu}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-400 via-bmc-gold to-amber-500 px-8 py-3.5 text-sm font-black uppercase tracking-wider text-black shadow-[0_10px_30px_rgba(252,184,0,0.35)] transition-all cursor-pointer hover:shadow-[0_15px_40px_rgba(252,184,0,0.5)]"
          >
            <span>Découvrir la Carte & Commander</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </motion.button>

          <p className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Livraison express à Dakar en 30-45 min · Emballage isotherme premium</span>
          </p>
        </div>
      </div>
    </section>
  )
}
