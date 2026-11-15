import { apiClient, ApiError as ClientApiError, getAuthToken } from '../api/client'
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

export function getAdminToken(): string | null {
  return getAuthToken()
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

function extractApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  for (const key of ['error', 'message', 'detail']) {
    if (typeof record[key] === 'string' && record[key].trim()) {
      return record[key].trim()
    }
  }
  return null
}

/**
 * Appelle l'API via `apiClient` (partage jeton Staff, CSRF, timeout et expiration de session 401).
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await apiClient<T>(path, init)
  } catch (err) {
    if (err instanceof ClientApiError) {
      const serverMsg = extractApiErrorMessage(err.payload)
      throw new ApiError(serverMsg || err.message, err.status, err.payload)
    }
    throw err
  }
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
  is_daily_special?: boolean
  popular?: boolean
  discount_percent?: number | null
  promo_price?: number | null
}

export interface MenuCatalogCategory {
  id: number
  name: string
  slug: string
  icon?: string
  items_count?: number
  items: MenuCatalogItem[]
}

/** Carte complète du restaurant (GET /api/menu/, public). */
export function fetchMenu(signal?: AbortSignal): Promise<{
  success: boolean
  total_items?: number
  categories?: MenuCatalogCategory[]
  items: MenuCatalogItem[]
}> {
  return apiRequest('/menu/', { signal })
}

/** Active/désactive un plat du jour (PATCH /api/daily-special/<id>/toggle/). */
export function toggleDailySpecial(id: number, isDailySpecial?: boolean): Promise<ToggleDailySpecialResponse> {
  return apiRequest<ToggleDailySpecialResponse>(`/daily-special/${id}/toggle/`, {
    method: 'PATCH',
    ...(typeof isDailySpecial === 'boolean' ? { body: JSON.stringify({ is_daily_special: isDailySpecial }) } : {}),
  })
}

export interface PromotionRecord {
  id: number
  code: string
  name: string
  category?: string
  price: number
  image_url?: string
  description?: string
  discountPercent?: number
  isPromo?: boolean
  active?: boolean
}

export interface StaffMemberRecord {
  id: number
  username: string
  role: string
  email: string
  is_active: boolean
  is_superuser: boolean
  date_joined: string
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
}): Promise<{ success: boolean; message: string; item: MenuCatalogItem }> {
  return apiRequest('/menu/items/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** Récupère les promotions actives (GET /api/promotions/). */
export function fetchPromotions(signal?: AbortSignal): Promise<{ success: boolean; promotions: PromotionRecord[] }> {
  return apiRequest('/promotions/', { signal })
}

/** Enregistre la liste des promotions (POST /api/promotions/). */
export function savePromotions(
  promotions: PromotionRecord[],
): Promise<{ success: boolean; message: string; promotions: PromotionRecord[] }> {
  return apiRequest('/promotions/', {
    method: 'POST',
    body: JSON.stringify(promotions),
  })
}

/** Liste des comptes employés (GET /api/staff/). */
export function fetchStaff(signal?: AbortSignal): Promise<{ success: boolean; staff: StaffMemberRecord[] }> {
  return apiRequest('/staff/', { signal })
}

/** Créer un compte employé (POST /api/staff/). */
export function createStaff(data: {
  username: string
  password: string
  role?: string
}): Promise<{ success: boolean; staff_member: StaffMemberRecord }> {
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

