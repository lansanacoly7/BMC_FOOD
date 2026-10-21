import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import type { MenuCategory, MenuResponse, Product } from '../types'
import { getFallbackMenuCategories, FALLBACK_PRODUCTS } from '../data/mockMenu'

export interface MenuState {
  categories: MenuCategory[]
  items: Product[]
  isLoading: boolean
  error: string | null
  isUsingFallback: boolean
  refetch: () => Promise<void>
}

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

    const load = async () => {
      try {
        const response = await apiRequest<MenuResponse>('/menu/', {
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (response.success && response.categories?.length > 0) {
          setCategories(response.categories)
          setItems(response.items ?? response.categories.flatMap((c) => c.items))
          setIsUsingFallback(false)
          setError(null)
        } else {
          throw new Error('Réponse vide du serveur')
        }
      } catch {
        if (controller.signal.aborted) return
        setCategories(getFallbackMenuCategories())
        setItems(FALLBACK_PRODUCTS)
        setIsUsingFallback(true)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
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
