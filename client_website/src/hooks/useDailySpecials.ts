import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import type { DailySpecialResponse, Product } from '../types'

/** Rafraîchissement du Plat du Jour : un changement fait dans l'admin apparaît sans recharger la page. */
const REFRESH_INTERVAL_MS = 10000
/** Après un échec (serveur injoignable), on espace les tentatives pour ne pas saturer la connexion mobile. */
const RETRY_AFTER_ERROR_MS = 60000

export interface DailySpecials {
  /** Plats du jour disponibles ; liste vide si aucun ou si l'API est injoignable. */
  specials: Product[]
  /** Vrai jusqu'à la première réponse (ou au premier échec) de l'API. */
  isLoading: boolean
}

/** Récupère GET /api/daily-special/, puis le rafraîchit régulièrement et au retour sur l'onglet. */
export function useDailySpecials(): DailySpecials {
  const [specials, setSpecials] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let refreshTimer: number | undefined
    let isFetching = false

    const load = async () => {
      if (isFetching) return
      isFetching = true
      window.clearTimeout(refreshTimer)
      let failed = false
      try {
        const { daily_specials } = await apiRequest<DailySpecialResponse>('/daily-special/', {
          signal: controller.signal,
        })
        setSpecials(daily_specials)
      } catch {
        // En cas d'échec, on garde le dernier Plat du Jour connu : le reste du site reste utilisable.
        failed = true
      }
      isFetching = false
      if (controller.signal.aborted) return
      setIsLoading(false)
      refreshTimer = window.setTimeout(load, failed ? RETRY_AFTER_ERROR_MS : REFRESH_INTERVAL_MS)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void load()
    }

    void load()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      controller.abort()
      window.clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { specials, isLoading }
}
