import type {
  AcknowledgeOrdersPayload,
  AcknowledgeOrdersResponse,
  DailySpecialResponse,
  OrderListResponse,
  OrderResponse,
  OrderStatus,
  ToggleDailySpecialResponse,
  UnnotifiedOrdersResponse,
} from '../types'

/** URL de base de l'API Django REST, surchargeable via VITE_API_BASE_URL dans .env.local. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')

const TOKEN_KEY = 'bmc_admin_token'

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Erreur HTTP portant le statut et le corps JSON renvoyés par l'API (ex. erreurs de validation DRF). */
export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

/**
 * Appelle l'API et renvoie le corps JSON typé.
 * Ajoute automatiquement l'en-tête Authorization: Token <token> si l'admin est connecté.
 * Lève une ApiError si le statut HTTP n'est pas 2xx, ou l'erreur réseau d'origine si le serveur est injoignable.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getAdminToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Token ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(`${init.method ?? 'GET'} ${path} a échoué (HTTP ${response.status})`, response.status, payload)
  }
  return payload as T
}

/** Commandes pas encore signalées à la cuisine : leur présence déclenche la sonnerie. */
export function fetchUnnotifiedOrders(signal?: AbortSignal): Promise<UnnotifiedOrdersResponse> {
  return apiRequest<UnnotifiedOrdersResponse>('/orders/events/unnotified/', { signal })
}

/**
 * Marque les commandes données comme prises en charge par la cuisine.
 * Une liste vide est ignorée : envoyée telle quelle, le serveur acquitterait TOUTES les commandes,
 * y compris celles arrivées après l'affichage de l'alerte.
 */
export async function acknowledgeOrders(orderRefs: string[]): Promise<AcknowledgeOrdersResponse | null> {
  if (orderRefs.length === 0) return null
  const payload: AcknowledgeOrdersPayload = { order_refs: orderRefs }
  return apiRequest<AcknowledgeOrdersResponse>('/orders/events/unnotified/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Récupère la liste des commandes avec filtre de statut optionnel. */
export function fetchOrders(status?: OrderStatus, signal?: AbortSignal): Promise<OrderListResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiRequest<OrderListResponse>(`/orders/${query}`, { signal })
}

/** Met à jour le statut d'une commande (PATCH /api/orders/<ref>/status/). */
export function updateOrderStatus(orderRef: string, status: OrderStatus): Promise<OrderResponse> {
  return apiRequest<OrderResponse>(`/orders/${encodeURIComponent(orderRef)}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/** Récupère les plats du jour configurés (GET /api/daily-special/). */
export function fetchDailySpecials(signal?: AbortSignal): Promise<DailySpecialResponse> {
  return apiRequest<DailySpecialResponse>('/daily-special/', { signal })
}

/** Plat de la carte tel que renvoyé par GET /api/menu/ (prix de carte + remise éventuelle). */
export interface MenuCatalogItem {
  id: number
  code: string
  name: string
  category?: number
  category_name?: string
  description: string
  price: number
  image_url: string
  is_available: boolean
  discount_percent?: number | null
  promo_price?: number | null
}

/** Carte complète du restaurant (GET /api/menu/, public). */
export function fetchMenu(signal?: AbortSignal): Promise<{ success: boolean; items: MenuCatalogItem[] }> {
  return apiRequest<{ success: boolean; items: MenuCatalogItem[] }>('/menu/', { signal })
}

/** Active/désactive un plat du jour (PATCH /api/daily-special/<id>/toggle/). */
export function toggleDailySpecial(id: number): Promise<ToggleDailySpecialResponse> {
  return apiRequest<ToggleDailySpecialResponse>(`/daily-special/${id}/toggle/`, {
    method: 'PATCH',
  })
}

/** Créer un nouveau plat au catalogue (POST /api/menu/items/). */
export function createMenuItem(data: {
  name: string
  price: number
  category?: string | number
  description?: string
  image_url?: string
  is_available?: boolean
  is_daily_special?: boolean
  popular?: boolean
}): Promise<{ success: boolean; message: string; item: any }> {
  return apiRequest('/menu/items/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** Récupère les promotions actives (GET /api/promotions/). */
export function fetchPromotions(signal?: AbortSignal): Promise<{ success: boolean; promotions: any[] }> {
  return apiRequest('/promotions/', { signal })
}

/** Enregistre la liste des promotions (POST /api/promotions/). */
export function savePromotions(promotions: any[]): Promise<{ success: boolean; message: string; promotions: any[] }> {
  return apiRequest('/promotions/', {
    method: 'POST',
    body: JSON.stringify(promotions),
  })
}

/** Liste des comptes employés (GET /api/staff/). */
export function fetchStaff(signal?: AbortSignal): Promise<{ success: boolean; staff: any[] }> {
  return apiRequest('/staff/', { signal })
}

/** Créer un compte employé (POST /api/staff/). */
export function createStaff(data: { username: string; password: string; role?: string }): Promise<{ success: boolean; staff_member: any }> {
  return apiRequest('/staff/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** Supprimer un compte employé (DELETE /api/staff/<id>/). */
export function deleteStaff(id: number): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/staff/${id}/`, {
    method: 'DELETE',
  })
}

