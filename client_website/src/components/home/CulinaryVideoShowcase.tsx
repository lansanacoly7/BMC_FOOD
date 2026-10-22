import { useState, useRef } from 'react'
import { Flame, Play, Pause, Volume2, VolumeX, ArrowRight, ShieldCheck, Sparkles, ChefHat } from 'lucide-react'
import { motion } from 'motion/react'

interface CulinaryVideoShowcaseProps {
  onExploreMenu: () => void
}

/**
 * Capsule Vidéo Culinaire Immersive BMC Food (Étape 3 du Benchmark New School Tacos)
 * - Cadre vidéo cinématique centré Dark Luxury avant le footer
 * - Valorisation du savoir-faire : Tacos pané croustillant d'exception à Dakar
 * - Contrôles interactifs (Play/Pause, Mute/Unmute) et badges de fabrication artisanale
 */
export function CulinaryVideoShowcase({ onExploreMenu }: CulinaryVideoShowcaseProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const nextMuted = !isMuted
    videoRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const pillars = [
    {
      icon: '🥖',
      title: 'Tortilla Toastée & Dorée',
      desc: 'Cuite et pressée minute sur plaque chaude pour un maintien parfait et un croustillant net.',
    },
    {
      icon: '🍗',
      title: 'Poulet Pané Mariné Maison',
      desc: 'Blancs de poulet frais marinés aux épices douces et enrobés de panure ultra-crispy.',
    },
    {
      icon: '🧀',
      title: 'Sauce Fromagère Onctueuse',
      desc: 'Recette secrète crémeuse et généreuse préparée chaque jour par nos chefs.',
    },
    {
      icon: '🔥',
      title: 'Gratinage & Finition',
      desc: 'Option gratinage au four avec mozzarella et cheddar fondant pour une gourmandise maximale.',
    },
  ]

  return (
    <section
      aria-labelledby="culinary-showcase-title"
      className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/90 to-zinc-950 py-16 sm:py-24 border-t border-white/5"
    >
      {/* Halo d'ambiance or Dark Luxury en arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-amber-500/10 blur-[130px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* EN-TÊTE DE LA SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-bmc-gold backdrop-blur-sm"
          >
            <Sparkles className="size-3.5 text-bmc-gold animate-pulse" />
            <span>Savoir-Faire Artisanal BMC</span>
          </motion.div>

          <motion.h2
            id="culinary-showcase-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight"
          >
            L'Art du{' '}
            <span className="bg-gradient-to-r from-amber-300 via-bmc-gold to-amber-500 bg-clip-text text-transparent">
              Tacos Pané
            </span>{' '}
            à Dakar
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed"
          >
            Une panure dorée ultra-croustillante, des viandes fraîches marinées selon notre recette secrète, 
            et un cœur coulant de sauce fromagère onctueuse. Découvrez l'exigence culinaire signée BMC Food.
          </motion.p>
        </div>

        {/* CADRE VIDÉO CINÉMATIQUE CENTRÉ (Inspiré du benchmark New School Tacos) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-amber-500/30 bg-black shadow-[0_0_60px_rgba(252,184,0,0.12)] group"
        >
          {/* Lecteur Vidéo */}
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              poster="/images/hero/tacos_mixte_pane_cut.webp"
              className="size-full object-cover object-center filter contrast-105"
            >
              <source src="/images/hero/bmc_video_hero.mp4" type="video/mp4" />
            </video>

            {/* Voile dégradé protecteur en bas pour les badges */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
            />

            {/* Boutons de contrôle vidéo discrets et soignés */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la vidéo'}
                className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-black/85 hover:border-bmc-gold hover:text-bmc-gold cursor-pointer"
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-black/85 hover:border-bmc-gold hover:text-bmc-gold cursor-pointer"
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-bmc-gold" />}
              </button>
            </div>

            {/* Badges d'authenticité superposés en bas de la vidéo */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-20">
              <div className="flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 px-3.5 py-1.5 text-xs text-white font-medium">
                <ChefHat className="size-3.5 text-bmc-gold" />
                <span>Préparé à la commande · Cité Mixta</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 px-3.5 py-1.5 text-xs font-black text-bmc-gold uppercase tracking-wider">
                <Flame className="size-3.5 text-amber-400" />
                <span>Croustillant & Fondant Garanti</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 PILIERS DU PRODUIT (Micro-cartes façon New School Tacos) */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-zinc-900/90 hover:-translate-y-1"
            >
              <div className="text-2xl mb-2">{pillar.icon}</div>
              <h3 className="font-display text-sm font-black uppercase tracking-tight text-white mb-1.5">
                {pillar.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* BOUTON D'ACTION PRINCIPAL VERS LE MENU */}
        <div className="mt-12 text-center space-y-3">
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
