import { useRef, type SyntheticEvent } from 'react'

interface LoopingFadeVideoProps {
  src: string
  className?: string
  poster?: string
}

/**
 * Vidéo d'ambiance du Hero :
 * Se charge et se lit une seule fois jusqu'à la fin, puis reste définitivement figée
 * sur la dernière image sans relecture (sans boucle ni coupure noire).
 */
export function LoopingFadeVideo({
  src,
  className = '',
}: LoopingFadeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasFinishedRef = useRef(false)

  const handleLoadedMetadata = (e: SyntheticEvent<HTMLVideoElement>) => {
    e.currentTarget.playbackRate = 1.35
  }

  const handlePlay = (e: SyntheticEvent<HTMLVideoElement>) => {
    e.currentTarget.playbackRate = 1.35
  }

  const handleTimeUpdate = () => {
    if (hasFinishedRef.current) return
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return

    // Met en pause sur la dernière image nette avant l'arrêt complet (évite l'écran noir EOF du navigateur)
    if (video.currentTime >= video.duration - 0.15) {
      hasFinishedRef.current = true
      video.pause()
    }
  }

  const handleEnded = () => {
    hasFinishedRef.current = true
    const video = videoRef.current
    if (video) {
      video.pause()
      if (Number.isFinite(video.duration)) {
        try {
          video.currentTime = Math.max(0, video.duration - 0.15)
        } catch {
          // ignore seek error
        }
      }
    }
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      preload="auto"
      onLoadedMetadata={handleLoadedMetadata}
      onPlay={handlePlay}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      className={`size-full object-cover object-center ${className}`}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}
