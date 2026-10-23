import { useCallback, useEffect, useRef, useState } from 'react'
import { acknowledgeOrders, fetchActiveOrders, transitionOrderStatus } from '../api/orders'
import { audioAlert } from '../lib/audioAlert'
import type { KdsOrder, KdsOrderStatus } from '../types/kds'

export type ApiConnectionState = 'connected' | 'syncing' | 'error' | 'offline'

export interface UndoableAction {
  orderRef: string
  previousStatus: KdsOrderStatus
  targetStatus: KdsOrderStatus
  timestamp: number
  timeoutId: ReturnType<typeof setTimeout>
}

export interface UseOrdersResult {
  orders: KdsOrder[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  lastSyncTime: Date | null
  connectionState: ApiConnectionState
  refresh: () => Promise<void>
  transitionOrder: (orderRef: string, newStatus: KdsOrderStatus) => Promise<void>
  undoTransition: (orderRef: string) => void
  activeUndoAction: UndoableAction | null
  acknowledgeNewOrders: () => void
}

const POLLING_INTERVAL_MS = 5000 // Polling 5s par défaut
const UNDO_DURATION_MS = 5000    // Fenêtre d'annulation 5s

/**
 * Hook temps réel KDS
 * Gère le cycle de vie des commandes, le rafraîchissement périodique (5s),
 * les alertes sonores de nouvelle commande, les mutations optimistes
 * avec fenêtre d'annulation (Undo) de 5 secondes et rollback en cas d'erreur.
 *
 * NOTE WEBSOCKET :
 * Pour passer du polling HTTP au WebSocket temps réel, instancier :
 * const ws = new WebSocket(`${WS_BASE_URL}/ws/kds/orders/`)
 * et écouter 'message' pour appliquer setOrders().
 */
export function useOrders(): UseOrdersResult {
  const [orders, setOrders] = useState<KdsOrder[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [connectionState, setConnectionState] = useState<ApiConnectionState>('syncing')
  const [activeUndoAction, setActiveUndoAction] = useState<UndoableAction | null>(null)

  // Suivi des IDs des commandes déjà vues pour détecter et sonner sur les NOUVELLES
  const knownOrderRefs = useRef<Set<string>>(new Set())
  const isInitialLoad = useRef<boolean>(true)

  // Détection en ligne / hors-ligne navigateur
  useEffect(() => {
    const handleOnline = () => setConnectionState('syncing')
    const handleOffline = () => setConnectionState('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /**
   * Récupération des commandes
   */
  const loadOrders = useCallback(async (isSilent = false) => {
    if (!navigator.onLine) {
      setConnectionState('offline')
      return
    }

    if (!isSilent) {
      setConnectionState('syncing')
    }

    try {
      const fetched = await fetchActiveOrders()
      setOrders(() => {
        // Détection de nouvelles commandes entrantes pour l'alerte sonore
        const incomingNew = fetched.filter(
          (o) => !knownOrderRefs.current.has(o.orderRef) && (o.status === 'pending' || o.isNew),
        )

        if (!isInitialLoad.current && incomingNew.length > 0) {
          // Sonnette de commande entrante
          audioAlert.playNewOrder()
        }

        // Mémorisation des références
        fetched.forEach((o) => knownOrderRefs.current.add(o.orderRef))
        isInitialLoad.current = false

        // Si une action Undo est en cours, préserver la modification optimiste locale
        if (activeUndoAction) {
          return fetched.map((o) =>
            o.orderRef === activeUndoAction.orderRef
              ? { ...o, status: activeUndoAction.targetStatus }
              : o,
          )
        }

        return fetched
      })

      setLastSyncTime(new Date())
      setConnectionState('connected')
      setError(null)
    } catch (err) {
      setError(err as Error)
      setConnectionState('error')
    } finally {
      setIsLoading(false)
    }
  }, [activeUndoAction])

  // Démarrage initial et boucle de polling
  useEffect(() => {
    void loadOrders(false)

    const interval = setInterval(() => {
      void loadOrders(true)
    }, POLLING_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [loadOrders])

  /**
   * Acquitte les nouvelles commandes (retire le badge NOUVEAU et coupe le son)
   */
  const acknowledgeNewOrders = useCallback(() => {
    const newRefs = orders.filter((o) => o.isNew).map((o) => o.orderRef)
    if (newRefs.length > 0) {
      void acknowledgeOrders(newRefs)
      setOrders((prev) =>
        prev.map((o) => (o.isNew ? { ...o, isNew: false } : o)),
      )
    }
  }, [orders])

  /**
   * Annulation (Undo) de la dernière transition dans les 5 secondes
   */
  const undoTransition = useCallback(
    (orderRef: string) => {
      if (!activeUndoAction || activeUndoAction.orderRef !== orderRef) return

      clearTimeout(activeUndoAction.timeoutId)
      const prev = activeUndoAction.previousStatus

      // Rétablissement visuel instantané
      setOrders((current) =>
        current.map((o) => (o.orderRef === orderRef ? { ...o, status: prev } : o)),
      )
      audioAlert.playActionConfirm()
      setActiveUndoAction(null)
    },
    [activeUndoAction],
  )

  /**
   * Transition de statut avec mise à jour optimiste + fenêtre Undo de 5 secondes
   */
  const transitionOrder = useCallback(
    async (orderRef: string, newStatus: KdsOrderStatus) => {
      const order = orders.find((o) => o.orderRef === orderRef)
      if (!order) return

      const previousStatus = order.status

      // 1. Mise à jour optimiste instantanée de l'UI
      setOrders((prev) =>
        prev.map((o) => (o.orderRef === orderRef ? { ...o, status: newStatus, isNew: false } : o)),
      )
      audioAlert.playActionConfirm()

      // 2. Si un ancien undo était en attente, le finaliser immédiatement
      if (activeUndoAction) {
        clearTimeout(activeUndoAction.timeoutId)
      }

      // 3. Programmer l'envoi réel à l'API après expiration des 5 secondes d'Undo
      const timeoutId = setTimeout(async () => {
        try {
          await transitionOrderStatus(orderRef, newStatus)
          setActiveUndoAction(null)
        } catch (apiErr) {
          // Rollback en cas d'erreur API
          console.error(`Échec transition ${orderRef} vers ${newStatus}:`, apiErr)
          setOrders((prev) =>
            prev.map((o) => (o.orderRef === orderRef ? { ...o, status: previousStatus } : o)),
          )
          setActiveUndoAction(null)
          setError(apiErr as Error)
        }
      }, UNDO_DURATION_MS)

      setActiveUndoAction({
        orderRef,
        previousStatus,
        targetStatus: newStatus,
        timestamp: Date.now(),
        timeoutId,
      })
    },
    [orders, activeUndoAction],
  )

  const refresh = useCallback(async () => {
    await loadOrders(false)
  }, [loadOrders])

  return {
    orders,
    isLoading,
    isError: connectionState === 'error',
    error,
    lastSyncTime,
    connectionState,
    refresh,
    transitionOrder,
    undoTransition,
    activeUndoAction,
    acknowledgeNewOrders,
  }
}
