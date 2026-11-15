import { useCallback, useEffect, useState } from 'react'
import { getOpeningStatus, type OpeningStatus } from '../lib/openingHours'

/**
 * Statut d'ouverture de BMC, recalculé toutes les 30 secondes :
 * à 02h00, les boutons de commande se ferment sans que le client ait à recharger la page.
 * `refresh()` force le recalcul immédiat (par exemple au moment d'envoyer une commande).
 */
export function useOpeningStatus(): OpeningStatus & { refresh: () => void } {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const refresh = useCallback(() => setNow(new Date()), [])
  return { ...getOpeningStatus(now), refresh }
}
