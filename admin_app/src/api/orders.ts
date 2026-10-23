import type { DailySpecialResponse, Order, OrderListResponse, OrderResponse, ToggleDailySpecialResponse } from '../types'
import type { KdsKpis, KdsOrder, KdsOrderStatus } from '../types/kds'
import { mapKdsStatusToApiStatus, mapOrderFromApi } from './adapter'
import { apiClient, USE_MOCK } from './client'
import { MOCK_KDS_ORDERS } from './mockData'

/**
 * Service API KDS Isolé (Django DRF + Support Mock)
 * Aucun fetch n'est effectué dans les composants.
 */

// Stockage en mémoire pour le mode Mock (permet de manipuler les statuts en direct)
let inMemoryMockOrders: KdsOrder[] = [...MOCK_KDS_ORDERS]

export function resetMockOrders(): void {
  inMemoryMockOrders = [...MOCK_KDS_ORDERS]
}

/**
 * Récupère l'ensemble des commandes pour le KDS
 */
export async function fetchActiveOrders(signal?: AbortSignal): Promise<KdsOrder[]> {
  if (USE_MOCK) {
    // Simule une micro-latence réseau réaliste (120ms)
    await new Promise((resolve) => setTimeout(resolve, 120))
    return [...inMemoryMockOrders]
  }

  try {
    const raw = await apiClient<OrderListResponse | Order[]>('/orders/', { signal })
    const list: Order[] = Array.isArray(raw)
      ? raw
      : (raw && 'orders' in raw && Array.isArray(raw.orders) ? raw.orders : [])
    return list.map(mapOrderFromApi)
  } catch (error) {
    // Si le serveur Django est arrêté en local, bascule en douceur sur le mock en développement
    if (import.meta.env.DEV) {
      console.warn('Backend Django injoignable, bascule automatique sur les données de démonstration :', error)
      return [...inMemoryMockOrders]
    }
    throw error
  }
}

/**
 * Effectue la transition de statut d'une commande
 */
export async function transitionOrderStatus(
  orderRef: string,
  newStatus: KdsOrderStatus,
): Promise<KdsOrder> {
  const cleanRef = orderRef.replace(/^#/, '')

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const index = inMemoryMockOrders.findIndex((o) => o.orderRef.replace(/^#/, '') === cleanRef)
    if (index === -1) {
      throw new Error(`Commande #${cleanRef} introuvable dans le mock`)
    }
    const updated = {
      ...inMemoryMockOrders[index],
      status: newStatus,
      isNew: false,
    }
    inMemoryMockOrders[index] = updated
    return updated
  }

  try {
    const apiStatus = mapKdsStatusToApiStatus(newStatus)
    const response = await apiClient<OrderResponse>(`/orders/${encodeURIComponent(cleanRef)}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: apiStatus }),
    })
    const mapped = mapOrderFromApi(response)
    mapped.status = newStatus // Conserve le statut précis KDS (ex. 'ready')
    return mapped
  } catch (error) {
    if (import.meta.env.DEV) {
      // Fallback local mock
      const index = inMemoryMockOrders.findIndex((o) => o.orderRef.replace(/^#/, '') === cleanRef)
      if (index !== -1) {
        inMemoryMockOrders[index] = { ...inMemoryMockOrders[index], status: newStatus }
        return inMemoryMockOrders[index]
      }
    }
    throw error
  }
}

/**
 * Acquitte les nouvelles commandes pour couper la sonnerie d'alerte
 */
export async function acknowledgeOrders(orderRefs: string[]): Promise<void> {
  if (orderRefs.length === 0) return
  const cleanRefs = orderRefs.map((r) => r.replace(/^#/, ''))

  if (USE_MOCK) {
    inMemoryMockOrders = inMemoryMockOrders.map((o) =>
      cleanRefs.includes(o.orderRef.replace(/^#/, '')) ? { ...o, isNew: false } : o,
    )
    return
  }

  try {
    await apiClient('/orders/events/unnotified/', {
      method: 'POST',
      body: JSON.stringify({ order_refs: cleanRefs }),
    })
  } catch {
    // Silencieux si échec d'acquittement
  }
}

/**
 * Calcule les KPI de la journée à partir des commandes actives et archivées
 */
export function calculateTodayKpis(orders: KdsOrder[]): KdsKpis {
  // Commandes non annulées
  const validOrders = orders.filter((o) => o.status !== 'cancelled')
  
  // Total encaissé (payé ou en livraison)
  const todayRevenue = validOrders
    .filter((o) => o.paymentStatus === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  // Nombre de commandes en cours de traitement
  const activeOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'delivering',
  ).length

  // Estimation du temps moyen de préparation (en minutes)
  const now = Date.now()
  const prepTimes = orders
    .filter((o) => o.status === 'ready' || o.status === 'delivering' || o.status === 'delivered')
    .map((o) => {
      const created = new Date(o.createdAt).getTime()
      return isNaN(created) ? 12 : Math.max(3, Math.min(60, Math.floor((now - created) / 60000)))
    })

  const avgPrepTimeMinutes = prepTimes.length > 0
    ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
    : 14

  return {
    todayRevenue,
    totalOrders: orders.length,
    activeOrders,
    avgPrepTimeMinutes,
  }
}

/**
 * Gestion du Plat du Jour
 */
export async function fetchDailySpecials(): Promise<DailySpecialResponse> {
  if (USE_MOCK) {
    return {
      success: true,
      count: 1,
      daily_specials: [
        {
          id: 1,
          code: 'grill-spec',
          name: 'Tiep Bou Dienn Penda Mbaye Royal',
          category: 1,
          category_name: 'Grillades & Spécialités',
          description: 'Riz rouge sénégalais parfumé, mérou blanc frais, légumes du jardin et bissap blanc.',
          price: 4500,
          image_url: '',
          is_available: true,
          is_daily_special: true,
          popular: true,
        },
      ],
    }
  }

  return apiClient<DailySpecialResponse>('/daily-special/')
}

export async function toggleDailySpecial(id: number): Promise<ToggleDailySpecialResponse> {
  if (USE_MOCK) {
    return {
      success: true,
      message: 'Statut mis à jour (Mock)',
      item: {
        id,
        code: 'spec-mock',
        name: 'Plat mock',
        category: 1,
        category_name: 'Mock',
        description: '',
        price: 4500,
        image_url: '',
        is_available: false,
        is_daily_special: true,
        popular: false,
      },
    }
  }
  return apiClient<ToggleDailySpecialResponse>(`/daily-special/${id}/toggle/`, {
    method: 'PATCH',
  })
}
