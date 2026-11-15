import { useCallback, useSyncExternalStore } from 'react'
import {
  getOpeningStatusSnapshot,
  type LiveOpeningStatus,
  refreshHealthStatus,
  subscribeOpeningStatus,
} from '../services/health'

export type { LiveOpeningStatus }

/**
 * Statut d'ouverture et d'acceptation des commandes (`/api/health/` + horaires de Dakar).
 * Partagé entre tous les composants pour éviter les appels dupliqués et refléter
 * immédiatement toute fermeture manuelle ou pause cuisine.
 */
export function useOpeningStatus(): LiveOpeningStatus & { refresh: () => Promise<LiveOpeningStatus> } {
  const snapshot = useSyncExternalStore(
    subscribeOpeningStatus,
    getOpeningStatusSnapshot,
    getOpeningStatusSnapshot,
  )
  const refresh = useCallback(() => refreshHealthStatus(), [])
  return { ...snapshot, refresh }
}
