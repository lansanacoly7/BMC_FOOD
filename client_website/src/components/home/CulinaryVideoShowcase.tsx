import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'

interface CulinaryScene {
  id: string
  /** Libellé court sous la barre de progression. */
  label: string
  /** Légende affichée pendant la scène. */
  caption: string
  src: string
}

const POSTER = '/images/hero/tacos_pane_knife_cut.jpg'

/** Les 5 scènes de la cuisine BMC, enchaînées chacune jusqu'à sa fin. */
const SCENES: CulinaryScene[] = [
  { id: 'knife_slice', label: 'La découpe', caption: 'La découpe, bien croustillante', src: '/videos/culinary/scene_1_knife_slice.mp4' },
  { id: 'cheese_pull', label: 'Le fromage', caption: 'Le cœur fondant qui file', src: '/videos/culinary/scene_2_cheese_pull.mp4' },
  { id: 'cheese_pour', label: 'La sauce', caption: 'Le nappage de sauce fromagère maison', src: '/videos/culinary/scene_3_cheese_pour.mp4' },
  { id: 'cheeseburger', label: 'Le burger', caption: 'Le cheeseburger saisi minute', src: '/videos/culinary/scene_4_cheeseburger.mp4' },
  { id: 'commercial', label: 'BMC Food', caption: 'Le goût du vrai plaisir', src: '/videos/culinary/scene_5_commercial.mp4' },
]

/**
 * « Le tacos pané, en images » en plein écran.
 * À l'approche, le cadre arrondi s'ouvre jusqu'aux bords de l'écran au rythme du défilement, et l'image se recule légèrement.
 * Les scènes s'enchaînent en fondu enchaîné ; des barres de progression (cliquables) montrent où l'on en est.
 * La vidéo ne joue que lorsqu'elle est à l'écran. Avec « réduire les animations », elle démarre en pause et le cadre est fixe.
 */
export function CulinaryVideoShowcase() {
  const reduceMotion = useReducedMotion() ?? false
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(reduceMotion)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const isOnScreen = useInView(sectionRef, { amount: 0.3 })
  const scene = SCENES[index]

  // Ouverture du cadre au défilement : de la carte arrondie au plein écran.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'start start'] })
  const inset = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [6, 0])
  const radius = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [32, 0])
  const clipPath = useMotionTemplate`inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}px)`
  const videoScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1.18, 1])

  // Lecture seulement à l'écran et si le client n'a pas mis en pause.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isOnScreen && !isPaused) video.play().catch(() => {})
    else video.pause()
  }, [isOnScreen, isPaused, index])

  const goTo = (next: number) => {
    setIndex(next)
    setProgress(0)
  }

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    if (videoRef.current) videoRef.current.muted = next
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="culinary-showcase-title"
      className="relative mt-16 bg-bmc-black sm:mt-24"
    >
      <motion.div
        style={{ clipPath }}
        className="relative h-[88svh] max-h-[60rem] min-h-[34rem] w-full overflow-hidden bg-black sm:h-svh"
      >
        {/* VIDÉO (fondu enchaîné d'une scène à l'autre) */}
        <motion.div style={{ scale: videoScale }} className="absolute inset-0">
          <AnimatePresence initial={false}>
            <motion.video
              key={scene.id}
              ref={(el: HTMLVideoElement | null) => {
                // La vidéo qui sort garde sa place le temps du fondu : on ne pointe que vers la nouvelle.
                if (el) videoRef.current = el
              }}
              src={scene.src}
              poster={POSTER}
              muted={isMuted}
              playsInline
              preload="auto"
              onEnded={() => goTo((index + 1) % SCENES.length)}
              onTimeUpdate={(event) => {
                const video = event.currentTarget
                setProgress(video.duration ? video.currentTime / video.duration : 0)
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.2 : 0.9, ease: 'easeInOut' }}
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover"
            />
          </AnimatePresence>
        </motion.div>

        {/* Voiles : fondu vers le noir de la page en bas, lisibilité des barres de progression en haut */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-bmc-black via-black/30 to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/70 to-transparent" />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-between px-4 pb-24 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8 lg:pb-20">
          {/* PROGRESSION DES SCÈNES */}
          <ol className="grid grid-cols-5 gap-2 sm:gap-3" aria-label="Scènes de la vidéo">
            {SCENES.map((item, i) => {
              const fill = i < index ? 1 : i === index ? progress : 0
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Scène ${i + 1} : ${item.caption}`}
                    aria-current={i === index ? 'step' : undefined}
                    className="group block w-full cursor-pointer py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
                  >
                    <span className="block h-[3px] overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/40">
                      <span
                        className="block h-full origin-left rounded-full bg-bmc-gold"
                        style={{ transform: `scaleX(${fill})` }}
                      />
                    </span>
                    <span
                      className={`mt-2.5 hidden text-xs font-semibold uppercase tracking-[0.16em] transition-colors sm:block ${
                        i === index ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {/* Titre de la section, pour les lecteurs d'écran : l'image parle d'elle-même */}
          <h2 id="culinary-showcase-title" className="sr-only">
            Le tacos pané, en images : préparé à la commande dans la cuisine BMC
          </h2>

          {/* COMMANDES */}
          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                aria-label={isPaused ? 'Lancer la vidéo' : 'Mettre la vidéo en pause'}
                className="grid size-12 cursor-pointer place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/30 backdrop-blur-md transition-colors hover:text-bmc-gold hover:ring-bmc-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
              >
                {isPaused ? <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                className="grid size-12 cursor-pointer place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/30 backdrop-blur-md transition-colors hover:text-bmc-gold hover:ring-bmc-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
              >
                {isMuted ? <VolumeX className="size-5" aria-hidden="true" /> : <Volume2 className="size-5 text-bmc-gold" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
