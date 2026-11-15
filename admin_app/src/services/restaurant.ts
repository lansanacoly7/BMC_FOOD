import { apiClient, isBackendUnreachable, USE_MOCK } from '../api/client'

export interface RestaurantStatus {
  isOpen: boolean          // Horaires d'ouverture normaux (11h-02h, fermé le lundi)
  acceptingOrders: boolean // Vrai si les commandes sont acceptées en direct
  manualClosed: boolean    // Fermeture manuelle ou pause cuisine déclenchée par le staff
  closedMessage: string    // Message affiché au client
}

const STORAGE_KEY = 'bmc_restaurant_settings_local'

function getLocalSettings(): { manualClosed: boolean; closedMessage: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore storage parse error
  }
  return {
    manualClosed: false,
    closedMessage: 'Le restaurant est actuellement fermé. Réouverture prochaine.',
  }
}

function saveLocalSettings(manualClosed: boolean, closedMessage: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ manualClosed, closedMessage }))
  } catch {
    // Ignore storage write error
  }
}

/**
 * Récupère l'état d'ouverture et de prise de commande du restaurant
 */
export async function fetchRestaurantStatus(): Promise<RestaurantStatus> {
  const local = getLocalSettings()

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return {
      isOpen: true,
      acceptingOrders: !local.manualClosed,
      manualClosed: local.manualClosed,
      closedMessage: local.closedMessage,
    }
  }

  try {
    const [healthRes, settingsRes] = await Promise.all([
      apiClient<{
        is_open?: boolean
        accepting_orders?: boolean
        closed_message?: string
      }>('/health/'),
      apiClient<{
        manual_closed?: boolean
        closed_message?: string
      }>('/admin/settings/'),
    ])

    const isOpen = healthRes?.is_open ?? true
    const manualClosed = Boolean(settingsRes?.manual_closed)
    const acceptingOrders =
      typeof healthRes?.accepting_orders === 'boolean'
        ? healthRes.accepting_orders
        : isOpen && !manualClosed
    const closedMessage =
      typeof settingsRes?.closed_message === 'string'
        ? settingsRes.closed_message
        : (healthRes?.closed_message ?? '')

    saveLocalSettings(manualClosed, closedMessage)

    return {
      isOpen,
      acceptingOrders,
      manualClosed,
      closedMessage,
    }
  } catch (error) {
    if (import.meta.env.DEV && isBackendUnreachable(error)) {
      return {
        isOpen: true,
        acceptingOrders: !local.manualClosed,
        manualClosed: local.manualClosed,
        closedMessage: local.closedMessage,
      }
    }
    throw error
  }
}

/**
 * Met à jour le paramétrage manuel d'ouverture et le message client
 * Appelle PATCH /api/admin/settings/ puis relit /api/health/ (Contrat V1)
 */
export async function updateRestaurantSettings(params: {
  manual_closed: boolean
  closed_message: string
}): Promise<RestaurantStatus> {
  if (USE_MOCK) {
    saveLocalSettings(params.manual_closed, params.closed_message)
    await new Promise((resolve) => setTimeout(resolve, 150))
    return {
      isOpen: true,
      acceptingOrders: !params.manual_closed,
      manualClosed: params.manual_closed,
      closedMessage: params.closed_message,
    }
  }

  try {
    const settingsRes = await apiClient<{
      manual_closed?: boolean
      closed_message?: string
    }>('/admin/settings/', {
      method: 'PATCH',
      body: JSON.stringify({
        manual_closed: params.manual_closed,
        closed_message: params.closed_message,
      }),
    })

    let isOpen = true
    let acceptingOrders = !(settingsRes?.manual_closed ?? params.manual_closed)
    let healthMessage = ''
    try {
      const healthRes = await apiClient<{
        is_open?: boolean
        accepting_orders?: boolean
        closed_message?: string
      }>('/health/')
      isOpen = healthRes?.is_open ?? true
      acceptingOrders =
        typeof healthRes?.accepting_orders === 'boolean'
          ? healthRes.accepting_orders
          : isOpen && !settingsRes?.manual_closed
      healthMessage = healthRes?.closed_message ?? ''
    } catch {
      // L'enregistrement admin a déjà réussi ; on calcule au plus juste.
    }

    const manualClosed = Boolean(settingsRes?.manual_closed ?? params.manual_closed)
    const closedMessage =
      typeof settingsRes?.closed_message === 'string'
        ? settingsRes.closed_message
        : healthMessage || params.closed_message

    saveLocalSettings(manualClosed, closedMessage)

    return {
      isOpen,
      acceptingOrders,
      manualClosed,
      closedMessage,
    }
  } catch (error) {
    if (import.meta.env.DEV && isBackendUnreachable(error)) {
      console.warn('Backend /admin/settings/ injoignable, réglage conservé localement :', error)
      saveLocalSettings(params.manual_closed, params.closed_message)
      return {
        isOpen: true,
        acceptingOrders: !params.manual_closed,
        manualClosed: params.manual_closed,
        closedMessage: params.closed_message,
      }
    }
    throw error
  }
}
