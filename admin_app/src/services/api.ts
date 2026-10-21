import type { AcknowledgeOrdersPayload, AcknowledgeOrdersResponse, UnnotifiedOrdersResponse } from '../types'

/** URL de base de l'API Django REST, surchargeable via VITE_API_BASE_URL dans .env.local. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api').replace(/\/+$/, '')

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
 * Lève une ApiError si le statut HTTP n'est pas 2xx, ou l'erreur réseau d'origine si le serveur est injoignable.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
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
