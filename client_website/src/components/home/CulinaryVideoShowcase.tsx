import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowRight,
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
    badge: 'Tacos pané',
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
    badge: 'Sauce fromagère',
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

/**
 * Capsule vidéo : les scènes s'enchaînent toutes seules, chacune jusqu'à sa fin
 * (pas de minuteur), avec un fondu entre deux scènes. Points de navigation pour sauter à une scène.
 */
export function CulinaryVideoShowcase({ onExploreMenu }: CulinaryVideoShowcaseProps) {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const currentScene = CULINARY_SCENES[activeSceneIndex]

  // Passe à la scène suivante (et reboucle sur la première après la dernière)
  const goToNext = useCallback(() => {
    setActiveSceneIndex((prev) => (prev + 1) % CULINARY_SCENES.length)
  }, [])

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
      className="relative overflow-hidden pt-8 sm:pt-12 pb-2 sm:pb-4"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* EN-TÊTE DE LA SECTION */}
        <div className="max-w-3xl mx-auto space-y-3 mb-6 sm:mb-8 text-center">
          <h2
            id="culinary-showcase-title"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight"
          >
            Le tacos pané, en images
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            La découpe, le fromage qui coule, les sauces : préparé à la commande.
          </p>
        </div>

        {/* CADRE VIDÉO CINÉMATIQUE MULTI-SCÈNES (Carrousel automatique) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black group"
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
                      ? 'w-5 sm:w-6 bg-bmc-gold'
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
                  muted={isMuted}
                  playsInline
                  onEnded={goToNext}
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
          <button
            type="button"
            onClick={onExploreMenu}
            className="group inline-flex h-12 items-center gap-2 rounded-lg bg-bmc-gold px-6 sm:px-8 text-sm sm:text-base font-semibold text-black transition-colors cursor-pointer hover:bg-amber-400"
          >
            <span>Voir la carte</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  )
}
