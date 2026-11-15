import { getOpeningStatus, type OpeningStatus } from '../lib/openingHours'
import type { HealthResponse } from '../types'
import { apiRequest } from './api'

/** État combiné d'ouverture et d'acceptation des commandes (/api/health/ + repli horaires Dakar). */
export interface LiveOpeningStatus extends OpeningStatus {
  /** Vrai seulement si le restaurant est ouvert ET accepte de nouvelles commandes. */
  acceptingOrders: boolean
  /** Vrai si le restaurant est ouvert selon ses horaires mais en pause temporaire. */
  isPaused: boolean
  /** Raison personnalisée de fermeture ou pause renvoyée par /api/health/. */
  closedMessage: string | null
  /** Indique si la réponse serveur /api/health/ fournit l'état V1. */
  hasServerHealth: boolean
}

const POLL_INTERVAL_MS = 30_000

/**
 * Calcule le statut live en donnant priorité aux champs V1 de `/api/health/`,
 * avec repli automatique sur les horaires de Dakar si le serveur ne les fournit pas encore.
 */
export function computeLiveOpeningStatus(now: Date, serverHealth: HealthResponse | null): LiveOpeningStatus {
  const local = getOpeningStatus(now)
  const hasServerOpen = typeof serverHealth?.is_open === 'boolean'
  const hasServerAccepting = typeof serverHealth?.accepting_orders === 'boolean'

  if (!hasServerOpen && !hasServerAccepting) {
    return {
      ...local,
      acceptingOrders: local.isOpen,
      isPaused: false,
      closedMessage: null,
      hasServerHealth: false,
    }
  }

  const isOpen = hasServerOpen ? Boolean(serverHealth?.is_open) : local.isOpen
  const serverAccepting = hasServerAccepting ? Boolean(serverHealth?.accepting_orders) : isOpen
  const acceptingOrders = isOpen && serverAccepting

  const rawMessage = typeof serverHealth?.closed_message === 'string' ? serverHealth.closed_message.trim() : ''
  const closedMessage = !acceptingOrders && rawMessage ? rawMessage : null

  // Si on est dans les horaires d'ouverture mais qu'accepting_orders est faux, c'est une pause cuisine
  // (sauf si le gérant a explicitement rédigé un message de fermeture).
  const explicitlyClosedByMessage = closedMessage ? /\bferm/i.test(closedMessage) : false
  const isPaused = !acceptingOrders && isOpen && !explicitlyClosedByMessage

  const label = acceptingOrders
    ? local.isOpen
      ? local.label
      : 'Ouvert maintenant'
    : isPaused
      ? closedMessage
        ? `Pause · ${closedMessage}`
        : 'Commandes en pause'
      : closedMessage
        ? `Fermé · ${closedMessage}`
        : `Fermé · réouverture ${local.reopensLabel}`

  return {
    isOpen,
    reopensLabel: local.reopensLabel,
    label,
    acceptingOrders,
    isPaused,
    closedMessage,
    hasServerHealth: true,
  }
}

let cachedHealth: HealthResponse | null = null
let currentSnapshot: LiveOpeningStatus = computeLiveOpeningStatus(new Date(), null)
let pollTimer: number | null = null
let inFlightFetch: Promise<LiveOpeningStatus> | null = null
const listeners = new Set<() => void>()

function snapshotsEqual(a: LiveOpeningStatus, b: LiveOpeningStatus): boolean {
  return (
    a.isOpen === b.isOpen &&
    a.reopensLabel === b.reopensLabel &&
    a.label === b.label &&
    a.acceptingOrders === b.acceptingOrders &&
    a.isPaused === b.isPaused &&
    a.closedMessage === b.closedMessage &&
    a.hasServerHealth === b.hasServerHealth
  )
}

function updateSnapshot(now: Date = new Date()): LiveOpeningStatus {
  const next = computeLiveOpeningStatus(now, cachedHealth)
  if (!snapshotsEqual(currentSnapshot, next)) {
    currentSnapshot = next
    for (const listener of listeners) listener()
  }
  return currentSnapshot
}

/** Interroge `GET /api/health/` (dédupliqué) et met à jour tous les abonnés. */
export async function refreshHealthStatus(): Promise<LiveOpeningStatus> {
  if (inFlightFetch) return inFlightFetch

  inFlightFetch = (async () => {
    try {
      const response = await apiRequest<HealthResponse>('/health/')
      const hasV1Flags =
        typeof response.is_open === 'boolean' || typeof response.accepting_orders === 'boolean'
      cachedHealth = hasV1Flags ? response : null
    } catch {
      // Serveur momentanément injoignable : on conserve le dernier état ou le repli horaire.
    } finally {
      inFlightFetch = null
    }
    return updateSnapshot(new Date())
  })()

  return inFlightFetch
}

function onVisibilityOrFocus() {
  if (document.visibilityState === 'visible') {
    void refreshHealthStatus()
  }
}

function startPolling() {
  if (pollTimer !== null) return
  void refreshHealthStatus()
  pollTimer = window.setInterval(() => {
    updateSnapshot(new Date())
    void refreshHealthStatus()
  }, POLL_INTERVAL_MS)
  window.addEventListener('focus', onVisibilityOrFocus)
  document.addEventListener('visibilitychange', onVisibilityOrFocus)
}

function stopPolling() {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
  window.removeEventListener('focus', onVisibilityOrFocus)
  document.removeEventListener('visibilitychange', onVisibilityOrFocus)
}

export function subscribeOpeningStatus(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1 && typeof window !== 'undefined') {
    startPolling()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && typeof window !== 'undefined') {
      stopPolling()
    }
  }
}

export function getOpeningStatusSnapshot(): LiveOpeningStatus {
  return currentSnapshot
}
