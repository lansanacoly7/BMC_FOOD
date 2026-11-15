import type { OrderStatus, PaymentStatus } from '../types'
import { ApiError, apiRequest } from './api'
import { loadHistory } from './clientData'

export interface OrderTrackItem {
  item_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface OrderTrackData {
  success?: boolean
  order_ref: string
  status: OrderStatus
  status_label: string
  payment_status: PaymentStatus | string
  payment_status_label?: string
  total_amount: number
  subtotal?: number
  delivery_fee?: number | null
  order_type?: 'delivery' | 'pickup'
  cancel_reason?: string | null
  created_at: string
  items_count: number
  items: OrderTrackItem[]
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  delivering: 'En livraison',
  delivered: 'Livrée',
  ready: 'Prête',
  cancelled: 'Annulée',
}

/**
 * Récupère le statut public allégé d'une commande via GET /api/orders/track/<ref>/
 * Conforme au contrat I13 / X2 : aucune donnée personnelle (ni nom, ni téléphone, ni adresse).
 */
export async function fetchOrderTrack(ref: string): Promise<OrderTrackData> {
  const cleanRef = ref.trim().toUpperCase()
  if (!cleanRef) {
    throw new Error('Veuillez saisir votre référence de commande.')
  }

  try {
    const data = await apiRequest<OrderTrackData>(`/orders/track/${encodeURIComponent(cleanRef)}/`)
    return {
      ...data,
      status_label: data.status_label || STATUS_LABELS[data.status] || data.status,
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        // Tentative de secours : vérification dans l'historique local du client
        const local = loadHistory().find((o) => o.order_ref.toUpperCase() === cleanRef)
        if (local) {
          return {
            order_ref: local.order_ref,
            status: local.status,
            status_label: STATUS_LABELS[local.status] || local.status,
            payment_status: local.payment_method === 'cash' ? 'unpaid' : 'pending',
            payment_status_label: local.payment_method === 'cash' ? 'À la livraison' : 'En attente',
            total_amount: local.total_amount,
            created_at: local.created_at,
            items_count: local.items.reduce((sum, item) => sum + item.quantity, 0),
            items: local.items.map((item) => ({
              item_name: item.name,
              quantity: item.quantity,
              unit_price: Math.round(local.total_amount / Math.max(1, local.items.length)),
              subtotal: Math.round(local.total_amount / Math.max(1, local.items.length)) * item.quantity,
            })),
          }
        }
        throw new Error(`Aucune commande trouvée pour la référence « ${cleanRef} ». Vérifiez la saisie (ex. BMC-849201).`, { cause: error })
      }
      if (error.status === 429) {
        throw new Error('Trop de recherches effectuées en peu de temps. Veuillez patienter une minute avant de réessayer.', { cause: error })
      }
      throw new Error(`Le serveur a renvoyé une erreur (${error.status}). Veuillez réessayer dans un instant.`, { cause: error })
    }

    // Erreur réseau / serveur inaccessible : vérifier si on a la commande en cache local
    const local = loadHistory().find((o) => o.order_ref.toUpperCase() === cleanRef)
    if (local) {
      return {
        order_ref: local.order_ref,
        status: local.status,
        status_label: STATUS_LABELS[local.status] || local.status,
        payment_status: local.payment_method === 'cash' ? 'unpaid' : 'pending',
        payment_status_label: local.payment_method === 'cash' ? 'À la livraison' : 'En attente',
        total_amount: local.total_amount,
        created_at: local.created_at,
        items_count: local.items.reduce((sum, item) => sum + item.quantity, 0),
        items: local.items.map((item) => ({
          item_name: item.name,
          quantity: item.quantity,
          unit_price: Math.round(local.total_amount / Math.max(1, local.items.length)),
          subtotal: Math.round(local.total_amount / Math.max(1, local.items.length)) * item.quantity,
        })),
      }
    }

    throw new Error('Impossible de joindre le serveur BMC Food. Vérifiez votre connexion internet.', { cause: error })
  }
}

/**
 * Annule une commande côté client via POST /api/orders/<ref>/cancel/
 * Possible seulement si la commande est encore en attente (status = pending).
 */
export async function cancelClientOrder(ref: string, phone?: string): Promise<{ success: boolean; message: string }> {
  const cleanRef = ref.trim().toUpperCase()
  if (!cleanRef) {
    throw new Error('Référence de commande manquante.')
  }

  try {
    const res = await apiRequest<{ success?: boolean; message?: string }>(`/orders/${encodeURIComponent(cleanRef)}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ phone: phone || '' }),
    })

    return {
      success: true,
      message: res.message || 'Votre commande a été annulée avec succès.',
    }
  } catch (error) {
    if (error instanceof ApiError) {
      const payload =
        error.payload && typeof error.payload === 'object'
          ? (error.payload as { message?: string; error?: string })
          : null
      const serverMessage = payload?.message || payload?.error
      if (error.status === 409) {
        throw new Error(
          serverMessage || 'Cette commande ne peut plus être annulée car sa préparation est déjà entamée. Veuillez contacter le restaurant.',
          { cause: error },
        )
      }
      if (error.status === 404) {
        throw new Error(`Aucune commande trouvée pour la référence « ${cleanRef} ».`, { cause: error })
      }
      if (error.status === 400 && serverMessage) {
        throw new Error(serverMessage, { cause: error })
      }
      throw new Error(
        serverMessage || `Échec de l'annulation (${error.status}). Contactez le restaurant au +221 77 856 13 13.`,
        { cause: error },
      )
    }

    throw new Error('Impossible de joindre le serveur BMC Food. Réessayez ou appelez le +221 77 856 13 13.', {
      cause: error,
    })
  }
}
