import { useEffect, useState } from 'react'

/**
 * Hook d'horloge partagé à tick unique (1 seconde)
 * Évite d'instancier un setInterval par carte de commande.
 * Tous les chronos du KDS se synchronisent sur cette même référence temporelle.
 */
export function useNow(intervalMs: number = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, intervalMs)

    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
