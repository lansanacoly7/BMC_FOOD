import type { Order, OrderStatus } from '../types'
import { ApiError, apiRequest } from './api'

/** Clés de stockage local : tout reste sur l'appareil du client. */
export const USER_KEY = 'bmc_client_user'
export const CLIENT_TOKEN_KEY = 'bmc_client_token'
export const PROFILE_KEY = 'bmc_client_profile'
export const HISTORY_KEY = 'bmc_order_history'
const HISTORY_LIMIT = 30

/** Informations personnelles complémentaires, en plus du nom et du téléphone de ClientUser. */
export interface ClientProfile {
  firstName: string
  lastName: string
  phone2: string
  email: string
  address: string
  /** Position GPS partagée volontairement par le client (bouton « Utiliser ma position »). */
  latitude?: number
  longitude?: number
  /** Quartier de livraison habituel (identifiant de lib/delivery.ts) : mémorisé à la première commande. */
  areaId?: string
  /** Nom et téléphone de la dernière commande, pour préremplir même sans compte. */
  contactName?: string
  contactPhone?: string
}

export const EMPTY_PROFILE: ClientProfile = {
  firstName: '',
  lastName: '',
  phone2: '',
  email: '',
  address: '',
}

/** Résumé d'une commande gardé sur l'appareil pour l'historique. */
export interface OrderSummary {
  order_ref: string
  created_at: string
  total_amount: number
  status: Order['status']
  payment_method: Order['payment_method']
  /** code permet de recommander exactement le même plat ; les anciennes commandes n'en ont pas (recherche par nom). */
  items: { name: string; quantity: number; code?: string }[]
  /** Commande mise en favori par le client : conservée même quand elle sort de la limite d'historique. */
  favorite?: boolean
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/** Événement émis à chaque changement de l'historique des commandes (nouvelle commande, statut mis à jour). */
export const ORDERS_CHANGED_EVENT = 'bmc:orders-changed'

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* stockage plein ou indisponible : on n'interrompt pas le parcours du client */
  }
  if (key === HISTORY_KEY) window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT))
}

/** Met à jour le statut d'une commande de l'historique (suivi en direct). Ne fait rien si le statut n'a pas changé. */
export function updateOrderStatus(orderRef: string, status: Order['status']) {
  const history = loadHistory()
  const entry = history.find((item) => item.order_ref === orderRef)
  if (!entry || entry.status === status) return
  writeJson(
    HISTORY_KEY,
    history.map((item) => (item.order_ref === orderRef ? { ...item, status } : item)),
  )
}

export function loadProfile(): ClientProfile {
  return { ...EMPTY_PROFILE, ...readJson<Partial<ClientProfile>>(PROFILE_KEY, {}) }
}

export function saveProfile(profile: ClientProfile) {
  writeJson(PROFILE_KEY, profile)
}

export function loadHistory(): OrderSummary[] {
  const list = readJson<OrderSummary[]>(HISTORY_KEY, [])
  return Array.isArray(list) ? list : []
}

export function getClientToken(): string | null {
  try {
    return localStorage.getItem(CLIENT_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setClientToken(token: string) {
  try {
    localStorage.setItem(CLIENT_TOKEN_KEY, token)
  } catch {
    /* stockage indisponible */
  }
}

export function clearClientToken() {
  try {
    localStorage.removeItem(CLIENT_TOKEN_KEY)
  } catch {
    /* rien à effacer */
  }
}

function toOrderSummary(order: Order): OrderSummary {
  return {
    order_ref: order.order_ref,
    created_at: order.created_at,
    total_amount: order.total_amount,
    status: order.status,
    payment_method: order.payment_method,
    items: (order.items ?? []).map((item) => ({
      name: item.item_name,
      quantity: item.quantity,
      code: item.menu_item_code,
    })),
  }
}

export interface ServerCustomerUser {
  name: string
  phone: string
  address?: string
}

/**
 * Synchronise le profil et l'historique réel depuis GET /api/auth/customer/profile/
 * lorsque le client possède un jeton d'authentification.
 */
export async function syncCustomerAccount(): Promise<{
  user: ServerCustomerUser | null
  history: OrderSummary[]
}> {
  const token = getClientToken()
  const localHistory = loadHistory()
  if (!token) {
    return { user: null, history: localHistory }
  }

  try {
    const res = await apiRequest<{
      success: boolean
      user?: ServerCustomerUser
      orders?: Order[]
    }>('/auth/customer/profile/', {
      headers: { Authorization: `Token ${token}` },
    })

    if (res?.user) {
      const storedProfile = loadProfile()
      const parts = res.user.name.trim().split(/\s+/)
      saveProfile({
        ...storedProfile,
        firstName: storedProfile.firstName || parts[0] || '',
        lastName: storedProfile.lastName || parts.slice(1).join(' '),
        address: res.user.address?.trim() ? res.user.address : storedProfile.address,
        contactName: res.user.name,
        contactPhone: res.user.phone,
      })
    }

    if (Array.isArray(res?.orders)) {
      const localByRef = new Map(localHistory.map((o) => [o.order_ref, o]))
      const serverRefs = new Set<string>()
      const mergedFromServer = res.orders.map((order) => {
        serverRefs.add(order.order_ref)
        const prev = localByRef.get(order.order_ref)
        return {
          ...toOrderSummary(order),
          favorite: prev?.favorite,
        }
      })
      const remainingLocal = localHistory.filter((o) => !serverRefs.has(o.order_ref))
      const combined = [...mergedFromServer, ...remainingLocal].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      writeJson(HISTORY_KEY, combined)
      return { user: res.user ?? null, history: combined }
    }

    return { user: res?.user ?? null, history: localHistory }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearClientToken()
    }
    return { user: null, history: localHistory }
  }
}

/**
 * Met à jour le nom et l'adresse sur le serveur (PATCH /api/auth/customer/profile/).
 * Silencieux si non authentifié ou serveur momentanément injoignable.
 */
export async function updateCustomerAccount(params: {
  name?: string
  address?: string
}): Promise<void> {
  const token = getClientToken()
  if (!token) return
  try {
    await apiRequest('/auth/customer/profile/', {
      method: 'PATCH',
      headers: { Authorization: `Token ${token}` },
      body: JSON.stringify(params),
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearClientToken()
    }
  }
}

/** Ajoute une commande envoyée avec succès en tête de l'historique (la plus récente d'abord). */
export function recordOrder(order: Order) {
  const summary = toOrderSummary(order)
  const others = loadHistory().filter((entry) => entry.order_ref !== summary.order_ref)
  const all = [summary, ...others]
  // La limite ne s'applique qu'aux commandes ordinaires : les favorites sont toujours gardées
  const recent = new Set(all.filter((entry) => !entry.favorite).slice(0, HISTORY_LIMIT))
  writeJson(HISTORY_KEY, all.filter((entry) => entry.favorite || recent.has(entry)))
}

/** Met ou retire une commande des favorites ; renvoie l'historique à jour. */
export function toggleFavoriteOrder(orderRef: string): OrderSummary[] {
  const next = loadHistory().map((entry) => (entry.order_ref === orderRef ? { ...entry, favorite: !entry.favorite } : entry))
  writeJson(HISTORY_KEY, next)
  return next
}

/**
 * Met à jour le statut des commandes récentes auprès du serveur (GET /api/orders/track/<ref>/).
 * Utilise l'endpoint public allégé pour rester accessible même sans session admin.
 * Silencieux en cas d'échec : l'historique local reste affiché tel quel.
 */
export async function refreshHistory(history: OrderSummary[]): Promise<OrderSummary[]> {
  const refreshed = await Promise.all(
    history.map(async (entry, index) => {
      if (index >= 5 || entry.status === 'delivered' || entry.status === 'cancelled') return entry
      try {
        const track = await apiRequest<{ status?: OrderStatus }>(
          `/orders/track/${encodeURIComponent(entry.order_ref)}/`,
        )
        return track?.status ? { ...entry, status: track.status } : entry
      } catch {
        return entry
      }
    }),
  )
  // Les favorites ont pu changer pendant les requêtes : on reprend l'état le plus récent
  const flags = new Map(loadHistory().map((entry) => [entry.order_ref, entry.favorite]))
  const merged = refreshed.map((entry) => ({ ...entry, favorite: flags.get(entry.order_ref) ?? entry.favorite }))
  writeJson(HISTORY_KEY, merged)
  return merged
}

/** Efface toutes les données du client sur cet appareil (compte, jeton, profil, historique). */
export function clearClientData() {
  try {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(CLIENT_TOKEN_KEY)
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    /* rien à effacer */
  }
}
