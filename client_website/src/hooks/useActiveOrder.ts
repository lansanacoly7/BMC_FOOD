import { useEffect, useState } from 'react'
import { HISTORY_KEY, loadHistory, ORDERS_CHANGED_EVENT, type OrderSummary, updateOrderStatus } from '../services/clientData'
import { fetchOrderTrack } from '../services/tracking'
import type { OrderStatus } from '../types'

/** Une commande reste « en cours » au plus 12 heures après sa création (au-delà, elle est forcément terminée). */
const ACTIVE_WINDOW_MS = 12 * 60 * 60 * 1000
/** Rythme de mise à jour du statut auprès du serveur. */
const POLL_MS = 30_000
const FINISHED: OrderStatus[] = ['delivered', 'cancelled']

/** Libellés courts du statut pour la barre flottante. */
export const ACTIVE_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Reçue, en attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivering: 'En route',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

/** La commande en cours : la plus récente de l'historique, si elle n'est ni livrée ni annulée et date de moins de 12 h. */
function readActiveOrder(): OrderSummary | null {
  const latest = loadHistory()[0]
  if (!latest || FINISHED.includes(latest.status)) return null
  const age = Date.now() - new Date(latest.created_at).getTime()
  return Number.isFinite(age) && age < ACTIVE_WINDOW_MS ? latest : null
}

/**
 * Commande en cours du client sur cet appareil, tenue à jour :
 * relue à chaque nouvelle commande ou changement d'historique (même depuis un autre onglet),
 * et son statut est redemandé au serveur toutes les 30 secondes tant que la page est visible.
 */
export function useActiveOrder(): OrderSummary | null {
  const [order, setOrder] = useState<OrderSummary | null>(readActiveOrder)

  // Relecture de l'historique : nouvelle commande, statut mis à jour, autre onglet.
  useEffect(() => {
    const reread = () => setOrder(readActiveOrder())
    const onStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_KEY) reread()
    }
    window.addEventListener(ORDERS_CHANGED_EVENT, reread)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', reread)
    return () => {
      window.removeEventListener(ORDERS_CHANGED_EVENT, reread)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', reread)
    }
  }, [])

  // Suivi en direct : statut public de la commande (aucune donnée personnelle), écrit dans l'historique.
  const ref = order?.order_ref
  useEffect(() => {
    if (!ref) return
    let cancelled = false
    const poll = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const track = await fetchOrderTrack(ref)
        if (!cancelled) updateOrderStatus(ref, track.status)
      } catch {
        /* réseau indisponible : la barre garde le dernier statut connu */
      }
    }
    void poll()
    const timer = window.setInterval(poll, POLL_MS)
    document.addEventListener('visibilitychange', poll)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [ref])

  return order
}
