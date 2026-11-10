import { useRef } from 'react'

interface LoopingFadeVideoProps {
  src: string
  className?: string
}

/**
 * Vidéo d'ambiance du Hero :
 * Se charge et se lit complètement une seule fois, puis reste figée sur la dernière image sans relecture (sans boucle).
 */
export function LoopingFadeVideo({ src, className = '' }: LoopingFadeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleEnded = () => {
    const video = videoRef.current
    if (video) {
      video.pause()
    }
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={handleEnded}
      className={`size-full object-cover object-center ${className}`}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}
