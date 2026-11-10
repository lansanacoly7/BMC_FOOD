import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAuthToken } from '../api/client'
import { acknowledgeOrders, fetchActiveOrders, isUsingDemoData, transitionOrderStatus } from '../api/orders'
import { audioAlert } from '../lib/audioAlert'
import type { KdsOrder, KdsOrderStatus } from '../types/kds'

export type ApiConnectionState = 'connected' | 'syncing' | 'error' | 'offline' | 'demo'

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
  /** Dernière action refusée ou perdue, à afficher à l'équipe. */
  actionError: string | null
  newOrdersSet: Set<string>
  isAudioMuted: boolean
  toggleAudio: () => void
  refresh: () => Promise<void>
  transitionOrder: (orderRef: string, newStatus: KdsOrderStatus) => Promise<void>
  undoTransition: (orderRef: string) => void
  activeUndoAction: UndoableAction | null
  acknowledgeNewOrders: () => void
}

const POLLING_INTERVAL_MS = 5000 // Polling 5 secondes (dans l'intervalle 5 à 10s)
const UNDO_DURATION_MS = 5000    // Fenêtre d'annulation 5s
const NEW_ORDER_DURATION_MS = 10000 // Marquage "Nouveau" pendant 10 secondes

/**
 * Hook temps réel KDS
 * Gère le cycle de vie des commandes, le rafraîchissement périodique (5s),
 * le marquage "Nouveau" pendant 10 secondes, les alertes sonores optionnelles,
 * et les mutations optimistes avec fenêtre d'annulation (Undo) de 5 secondes.
 */
export function useOrders(nowMs: number = Date.now()): UseOrdersResult {
  const [orders, setOrders] = useState<KdsOrder[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [connectionState, setConnectionState] = useState<ApiConnectionState>('syncing')
  const [activeUndoAction, setActiveUndoAction] = useState<UndoableAction | null>(null)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => audioAlert.muted)
  const [actionError, setActionError] = useState<string | null>(null)

  // Suivi des IDs des commandes déjà vues pour détecter et sonner sur les NOUVELLES
  const knownOrderRefs = useRef<Set<string>>(new Set())
  const newOrderTimestamps = useRef<Map<string, number>>(new Map())
  const isInitialLoad = useRef<boolean>(true)

  const toggleAudio = useCallback(() => {
    const next = audioAlert.toggleMute()
    setIsAudioMuted(next)
  }, [])

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
    // Pas de session : rien à lire tant que l'équipe n'est pas connectée.
    if (!getAuthToken()) return

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
        const currentTime = Date.now()

        // Détection de nouvelles commandes entrantes
        const incomingNew = fetched.filter(
          (o) => !knownOrderRefs.current.has(o.orderRef) && (o.status === 'pending' || o.isNew),
        )

        // Enregistrer l'heure d'apparition pour la durée "Nouveau" de 10s
        incomingNew.forEach((o) => {
          if (!newOrderTimestamps.current.has(o.orderRef)) {
            newOrderTimestamps.current.set(o.orderRef, currentTime)
          }
        })

        // Lors du chargement initial, marquer aussi les commandes récentes de moins de 10s ou avec isNew
        if (isInitialLoad.current) {
          fetched.forEach((o) => {
            const createdMs = new Date(o.createdAt).getTime()
            if (o.isNew || (!isNaN(createdMs) && currentTime - createdMs < NEW_ORDER_DURATION_MS)) {
              if (!newOrderTimestamps.current.has(o.orderRef)) {
                newOrderTimestamps.current.set(o.orderRef, currentTime)
              }
            }
          })
        }

        // Sonnette optionnelle de commande entrante
        if (!isInitialLoad.current && incomingNew.length > 0) {
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
      setConnectionState(isUsingDemoData() ? 'demo' : 'connected')
      setError(null)
    } catch (err) {
      setError(err as Error)
      setConnectionState('error')
    } finally {
      setIsLoading(false)
    }
  }, [activeUndoAction])

  // Démarrage initial et boucle de polling toutes les 5 secondes
  useEffect(() => {
    void loadOrders(false)

    const interval = setInterval(() => {
      void loadOrders(true)
    }, POLLING_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [loadOrders])

  /**
   * Ensemble des références de commandes marquées "Nouveau" (pendant 10 secondes)
   */
  const newOrdersSet = useMemo(() => {
    const activeNew = new Set<string>()
    newOrderTimestamps.current.forEach((timestamp, ref) => {
      if (nowMs - timestamp < NEW_ORDER_DURATION_MS) {
        activeNew.add(ref)
      }
    })
    return activeNew
  }, [nowMs])

  /**
   * Acquitte les nouvelles commandes
   */
  const acknowledgeNewOrders = useCallback(() => {
    const newRefs = orders.filter((o) => o.isNew).map((o) => o.orderRef)
    if (newRefs.length > 0) {
      void acknowledgeOrders(newRefs)
    }
  }, [orders])

  /**
   * Annulation (Undo) de la dernière transition dans les 5 secondes (sans modale)
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
   * Envoie une transition au serveur. En cas de refus, la commande reprend son statut
   * et l'équipe est prévenue.
   */
  const sendTransition = useCallback(
    async (orderRef: string, newStatus: KdsOrderStatus, previousStatus: KdsOrderStatus) => {
      try {
        await transitionOrderStatus(orderRef, newStatus)
      } catch (apiErr) {
        console.error(`Échec transition ${orderRef} vers ${newStatus}:`, apiErr)
        setOrders((prev) =>
          prev.map((o) => (o.orderRef === orderRef ? { ...o, status: previousStatus } : o)),
        )
        setError(apiErr as Error)
        setActionError(`La commande ${orderRef} n'a pas pu être mise à jour. Réessayez.`)
        setTimeout(() => setActionError(null), 5000)
      }
    },
    [],
  )

  /**
   * Transition de statut en 1 clic avec mise à jour optimiste + fenêtre Undo de 5 secondes
   */
  const transitionOrder = useCallback(
    async (orderRef: string, newStatus: KdsOrderStatus) => {
      const order = orders.find((o) => o.orderRef === orderRef)
      if (!order) return

      const previousStatus = order.status

      // 1. Mise à jour optimiste instantanée de l'UI (1 seul clic)
      setOrders((prev) =>
        prev.map((o) => (o.orderRef === orderRef ? { ...o, status: newStatus, isNew: false } : o)),
      )
      audioAlert.playActionConfirm()

      // 2. Si un ancien undo était en attente, l'envoyer tout de suite : sinon il serait perdu
      if (activeUndoAction) {
        clearTimeout(activeUndoAction.timeoutId)
        void sendTransition(
          activeUndoAction.orderRef,
          activeUndoAction.targetStatus,
          activeUndoAction.previousStatus,
        )
      }

      // 3. Programmer l'envoi réel à l'API après expiration des 5 secondes d'Undo
      const timeoutId = setTimeout(async () => {
        await sendTransition(orderRef, newStatus, previousStatus)
        setActiveUndoAction(null)
      }, UNDO_DURATION_MS)

      setActiveUndoAction({
        orderRef,
        previousStatus,
        targetStatus: newStatus,
        timestamp: Date.now(),
        timeoutId,
      })
    },
    [orders, activeUndoAction, sendTransition],
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
    actionError,
    newOrdersSet,
    isAudioMuted,
    toggleAudio,
    refresh,
    transitionOrder,
    undoTransition,
    activeUndoAction,
    acknowledgeNewOrders,
  }
}
