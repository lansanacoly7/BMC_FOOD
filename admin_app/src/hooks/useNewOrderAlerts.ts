import { useCallback, useEffect, useRef, useState } from 'react'
import { acknowledgeOrders, fetchUnnotifiedOrders } from '../services/api'
import { audioAlertService } from '../services/audioAlertService'
import { closeOrderNotifications, notifyNewOrder } from '../services/notificationService'
import type { Order } from '../types'

/** Fréquence d'interrogation de GET /api/orders/events/unnotified/. */
const POLL_INTERVAL_MS = 4000

const byOldestFirst = (a: Order, b: Order) => a.created_at.localeCompare(b.created_at)

export interface NewOrderAlerts {
  /** Commandes arrivées et pas encore prises en charge, de la plus ancienne à la plus récente. */
  pendingOrders: Order[]
  /** Prend en charge les commandes affichées : coupe la sonnerie immédiatement puis prévient le serveur. */
  acknowledge: () => void
  /** Vrai si la dernière interrogation de l'API a échoué. */
  isOffline: boolean
}

/**
 * Surveille l'arrivée des commandes (`is_notified_to_admin === false`) : sonnerie répétée,
 * notification système par commande, et acquittement par la cuisine.
 */
export function useNewOrderAlerts(): NewOrderAlerts {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [isOffline, setIsOffline] = useState(false)
  // Prises en charge côté cuisine : ne doivent plus sonner, même si le serveur n'a pas encore reçu l'acquittement.
  const acknowledgedRefs = useRef(new Set<string>())
  // Déjà signalées par une notification système : une seule notification par commande.
  const announcedRefs = useRef(new Set<string>())

  useEffect(() => {
    const controller = new AbortController()
    let pollTimer: number | undefined

    const poll = async () => {
      try {
        const { new_orders: unnotified } = await fetchUnnotifiedOrders(controller.signal)
        const serverRefs = new Set(unnotified.map((order) => order.order_ref))

        // Le serveur ne renvoie plus ces commandes : acquittement confirmé, inutile de les suivre.
        for (const refs of [acknowledgedRefs.current, announcedRefs.current]) {
          for (const ref of refs) if (!serverRefs.has(ref)) refs.delete(ref)
        }

        // Acquittements pas encore enregistrés par le serveur (ex. coupure réseau) : on les renvoie.
        const unconfirmed = [...acknowledgedRefs.current]
        if (unconfirmed.length > 0) acknowledgeOrders(unconfirmed).catch(() => {})

        const fresh = unnotified.filter((order) => !acknowledgedRefs.current.has(order.order_ref)).sort(byOldestFirst)
        for (const order of fresh) {
          if (announcedRefs.current.has(order.order_ref)) continue
          announcedRefs.current.add(order.order_ref)
          notifyNewOrder(order)
        }

        setPendingOrders(fresh)
        setIsOffline(false)
        if (fresh.length > 0) audioAlertService.start()
        else audioAlertService.stop()
      } catch {
        if (controller.signal.aborted) return
        setIsOffline(true)
      }
      if (!controller.signal.aborted) pollTimer = window.setTimeout(poll, POLL_INTERVAL_MS)
    }

    void poll()
    return () => {
      controller.abort()
      window.clearTimeout(pollTimer)
      audioAlertService.stop()
    }
  }, [])

  const acknowledge = useCallback(() => {
    audioAlertService.stop()
    const refs = pendingOrders.map((order) => order.order_ref)
    for (const ref of refs) acknowledgedRefs.current.add(ref)
    closeOrderNotifications(refs)
    setPendingOrders([])
    // En cas d'échec, l'acquittement est renvoyé à la prochaine interrogation.
    acknowledgeOrders(refs).catch(() => {})
  }, [pendingOrders])

  return { pendingOrders, acknowledge, isOffline }
}
