import type { Order } from '../types'
import { apiRequest } from './api'

/** Clés de stockage local : tout reste sur l'appareil du client. */
export const USER_KEY = 'bmc_client_user'
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

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* stockage plein ou indisponible : on n'interrompt pas le parcours du client */
  }
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

/** Ajoute une commande envoyée avec succès en tête de l'historique (la plus récente d'abord). */
export function recordOrder(order: Order) {
  const summary: OrderSummary = {
    order_ref: order.order_ref,
    created_at: order.created_at,
    total_amount: order.total_amount,
    status: order.status,
    payment_method: order.payment_method,
    items: order.items.map((item) => ({ name: item.item_name, quantity: item.quantity, code: item.menu_item_code })),
  }
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
 * Met à jour le statut des commandes récentes auprès du serveur (GET /api/orders/<ref>/).
 * Silencieux en cas d'échec : l'historique local reste affiché tel quel.
 */
export async function refreshHistory(history: OrderSummary[]): Promise<OrderSummary[]> {
  const refreshed = await Promise.all(
    history.map(async (entry, index) => {
      if (index >= 5 || entry.status === 'delivered' || entry.status === 'cancelled') return entry
      try {
        const { order } = await apiRequest<{ order: Order }>(`/orders/${encodeURIComponent(entry.order_ref)}/`)
        return { ...entry, status: order.status }
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

/** Efface toutes les données du client sur cet appareil (compte, profil, historique). */
export function clearClientData() {
  try {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    /* rien à effacer */
  }
}
