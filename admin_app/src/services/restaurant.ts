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
    const res = await apiClient<{
      is_open?: boolean
      accepting_orders?: boolean
      closed_message?: string
      manual_closed?: boolean
    }>('/health/')

    const isOpen = res?.is_open ?? true
    const manualClosed = res?.manual_closed ?? local.manualClosed
    const acceptingOrders = res?.accepting_orders ?? (!manualClosed && isOpen)
    const closedMessage = res?.closed_message || local.closedMessage

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
 * Appelle PATCH /api/admin/settings/ (Contrat V1)
 */
export async function updateRestaurantSettings(params: {
  manual_closed: boolean
  closed_message: string
}): Promise<RestaurantStatus> {
  saveLocalSettings(params.manual_closed, params.closed_message)

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    return {
      isOpen: true,
      acceptingOrders: !params.manual_closed,
      manualClosed: params.manual_closed,
      closedMessage: params.closed_message,
    }
  }

  try {
    const res = await apiClient<{
      is_open?: boolean
      accepting_orders?: boolean
      manual_closed?: boolean
      closed_message?: string
    }>('/admin/settings/', {
      method: 'PATCH',
      body: JSON.stringify({
        manual_closed: params.manual_closed,
        closed_message: params.closed_message,
      }),
    })

    return {
      isOpen: res?.is_open ?? true,
      acceptingOrders: res?.accepting_orders ?? !params.manual_closed,
      manualClosed: res?.manual_closed ?? params.manual_closed,
      closedMessage: res?.closed_message || params.closed_message,
    }
  } catch (error) {
    // Si l'endpoint backend V1 de Pathé est en cours de déploiement
    if (import.meta.env.DEV) {
      console.warn("Backend /admin/settings/ indisponible, réglage conservé en mémoire locale :", error)
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
