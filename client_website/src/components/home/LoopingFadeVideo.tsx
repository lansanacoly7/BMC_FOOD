import { useRef, useState } from 'react'

/** Durée du fondu entre la fin d'une lecture et le début de la suivante. */
const FADE_SECONDS = 0.9

interface LoopingFadeVideoProps {
  src: string
  className?: string
}

/**
 * Vidéo d'ambiance en boucle sans coupure : deux lectures de la même vidéo sont superposées.
 * Quelques instants avant la fin de la première, la seconde démarre au début et apparaît en fondu
 * par-dessus ; la première est masquée une fois le fondu terminé. Aucune image noire entre deux boucles.
 * Si le visiteur demande moins d'animations, la vidéo boucle simplement.
 */
export function LoopingFadeVideo({ src, className = '' }: LoopingFadeVideoProps) {
  const first = useRef<HTMLVideoElement>(null)
  const second = useRef<HTMLVideoElement>(null)
  const refs = [first, second]
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const startNext = (from: number) => {
    const next = 1 - from
    const nextVideo = refs[next].current
    if (!nextVideo) return
    activeRef.current = next
    nextVideo.currentTime = 0
    nextVideo.play().catch(() => {
      /* lecture muette refusée : la vidéo courante continue jusqu'à sa fin */
    })
    setActive(next)
  }

  const handleTimeUpdate = (index: number) => {
    if (index !== activeRef.current) return
    const video = refs[index].current
    if (!video || !Number.isFinite(video.duration)) return
    if (video.duration - video.currentTime <= FADE_SECONDS) startNext(index)
  }

  const handleEnded = (index: number) => {
    const video = refs[index].current
    if (!video) return
    if (index === activeRef.current) {
      // Le fondu n'a pas eu lieu (onglet en arrière-plan, lecture ralentie) : on relance la même vidéo
      video.currentTime = 0
      video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }

  if (reduceMotion) {
    return (
      <video autoPlay loop muted playsInline preload="auto" className={className}>
        <source src={src} type="video/mp4" />
      </video>
    )
  }

  return (
    <>
      {[0, 1].map((index) => {
        const isActive = active === index
        return (
          <video
            key={index}
            ref={refs[index]}
            autoPlay={index === 0}
            muted
            playsInline
            preload="auto"
            onTimeUpdate={() => handleTimeUpdate(index)}
            onEnded={() => handleEnded(index)}
            className={`absolute inset-0 ${className}`}
            style={{
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 2 : 1,
              // La vidéo qui arrive apparaît en fondu ; l'ancienne reste visible dessous puis disparaît
              transition: isActive ? `opacity ${FADE_SECONDS}s linear` : `opacity 0s linear ${FADE_SECONDS}s`,
            }}
          >
            <source src={src} type="video/mp4" />
          </video>
        )
      })}
    </>
  )
}
