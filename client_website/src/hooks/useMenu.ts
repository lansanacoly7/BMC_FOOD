import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import type { MenuCategory, MenuResponse, Product } from '../types'
import { getProductImageUrl } from '../lib/productImages'
import { getFallbackMenuCategories, FALLBACK_PRODUCTS } from '../data/mockMenu'

export interface MenuState {
  categories: MenuCategory[]
  items: Product[]
  isLoading: boolean
  error: string | null
  isUsingFallback: boolean
  refetch: () => Promise<void>
}

/** Rafraîchissement périodique du catalogue pour refléter les nouveaux plats ou indisponibilités ajoutés en admin. */
const MENU_REFRESH_INTERVAL_MS = 30_000

/** Hook de récupération du catalogue officiel BMC Food via GET /api/menu/. */
export function useMenu(): MenuState {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let refreshTimer: number | undefined
    let isFetching = false

    const load = async (isBackground = false) => {
      if (isFetching) return
      isFetching = true
      window.clearTimeout(refreshTimer)
      try {
        const response = await apiRequest<MenuResponse>('/menu/', {
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (response.success && response.categories?.length > 0) {
          const rawItems = response.items ?? response.categories.flatMap((c) => c.items)
          const enrichedItems = rawItems.map((p) => ({
            ...p,
            image_url: getProductImageUrl(p),
          }))
          const enrichedCategories = response.categories.map((c) => ({
            ...c,
            items: c.items.map((p) => ({
              ...p,
              image_url: getProductImageUrl(p),
            })),
          }))
          setCategories(enrichedCategories)
          setItems(enrichedItems)
          setIsUsingFallback(false)
          setError(null)
        } else {
          throw new Error('Réponse vide du serveur')
        }
      } catch {
        if (controller.signal.aborted) return
        // En arrière-plan, conserver le dernier catalogue valide si une requête échoue ponctuellement
        if (!isBackground) {
          setCategories(getFallbackMenuCategories())
          setItems(FALLBACK_PRODUCTS)
          setIsUsingFallback(true)
        }
      } finally {
        isFetching = false
        if (!controller.signal.aborted) {
          setIsLoading(false)
          refreshTimer = window.setTimeout(() => void load(true), MENU_REFRESH_INTERVAL_MS)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void load(true)
      }
    }

    void load(false)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      controller.abort()
      window.clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshTrigger])

  return {
    categories,
    items,
    isLoading,
    error,
    isUsingFallback,
    refetch,
  }
}
