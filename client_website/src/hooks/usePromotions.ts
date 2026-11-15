import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

export interface Promotion {
  id: number
  code: string
  name: string
  category?: string
  price: number
  discountPercent?: number
  isPromo: boolean
  image_url?: string
  description?: string
}

interface PromotionsResponse {
  success: boolean
  count: number
  promotions: Promotion[]
}

const REFRESH_INTERVAL_MS = 10000

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let timer: number | undefined
    let isFetching = false

    const load = async () => {
      if (isFetching) return
      isFetching = true
      window.clearTimeout(timer)
      try {
        const res = await apiRequest<PromotionsResponse>('/promotions/', {
          signal: controller.signal,
        })
        if (res && res.success && Array.isArray(res.promotions)) {
          setPromotions(res.promotions.filter((p) => p.isPromo !== false))
        }
      } catch {
        // En cas d'erreur de requête, garder l'état précédent
      } finally {
        isFetching = false
        if (!controller.signal.aborted) {
          setIsLoading(false)
          timer = window.setTimeout(load, REFRESH_INTERVAL_MS)
        }
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void load()
    }

    void load()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return { promotions, isLoading }
}
