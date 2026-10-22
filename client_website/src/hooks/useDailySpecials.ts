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
        // En cas d'absence d'API Django, on synchronise avec le choix fait dans l'Admin local
        failed = true
        try {
          const storedCode = localStorage.getItem('bmc_active_special_code')
          if (storedCode === '') {
            setSpecials([])
          } else if (storedCode) {
            const { FALLBACK_PRODUCTS } = await import('../data/mockMenu')
            const matched = FALLBACK_PRODUCTS.find((p) => p.code === storedCode)
            if (matched) {
              setSpecials([{ ...matched, is_daily_special: true }])
            }
          }
        } catch {
          // Utilisation du fallback standard
        }
      }
      isFetching = false
      if (controller.signal.aborted) return
      setIsLoading(false)
      refreshTimer = window.setTimeout(load, failed ? RETRY_AFTER_ERROR_MS : REFRESH_INTERVAL_MS)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void load()
    }

    const handleStorageChange = () => {
      void load()
    }

    void load()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      controller.abort()
      window.clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return { specials, isLoading }
}
