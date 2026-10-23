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
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api').replace(/\/+$/, '')

const TOKEN_KEY = 'bmc_admin_token'
/** Jeton staff DRF par défaut pour le développement local (admin / admin123). */
export const DEV_DEFAULT_TOKEN = '5950ee892e2812d22579dfb9527874765235f85e'

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}


export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Ignore storage errors in private browsing
  }
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore storage errors in private browsing
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

/** Connexion administrateur par identifiants (POST /api/auth/token/). */
export async function loginAdmin(username: string, password: string): Promise<{ token: string }> {
  const res = await apiRequest<{ token: string }>('/auth/token/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (res.token) {
    setAdminToken(res.token)
  }
  return res
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

/** Active/désactive un plat du jour (PATCH /api/daily-special/<id>/toggle/). */
export function toggleDailySpecial(id: number): Promise<ToggleDailySpecialResponse> {
  return apiRequest<ToggleDailySpecialResponse>(`/daily-special/${id}/toggle/`, {
    method: 'PATCH',
  })
}
