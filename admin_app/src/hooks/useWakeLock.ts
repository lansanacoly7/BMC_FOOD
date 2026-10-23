import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook Screen Wake Lock API
 * Maintient l'écran de la tablette ou de l'afficheur cuisine allumé en continu
 * sans mise en veille automatique pendant le service rush.
 */
export function useWakeLock() {
  const [isActive, setIsActive] = useState<boolean>(false)
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    setIsSupported('wakeLock' in navigator)
  }, [])

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return false
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen')
      setIsActive(true)

      sentinelRef.current.addEventListener('release', () => {
        setIsActive(false)
        sentinelRef.current = null
      })
      return true
    } catch {
      setIsActive(false)
      return false
    }
  }, [])

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release()
      } catch {
        // Silencieux
      }
      sentinelRef.current = null
      setIsActive(false)
    }
  }, [])

  const toggle = useCallback(() => {
    if (isActive) {
      void release()
    } else {
      void request()
    }
  }, [isActive, release, request])

  // Réactivation automatique lorsque l'onglet redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && !sentinelRef.current) {
        void request()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void release()
    }
  }, [isActive, request, release])

  // Activation automatique par défaut sur les écrans KDS
  useEffect(() => {
    if ('wakeLock' in navigator) {
      void request()
    }
  }, [request])

  return { isSupported, isActive, request, release, toggle }
}
