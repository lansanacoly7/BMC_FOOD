import type { KdsOrder, KdsOrderStatus } from '../../types/kds'

export interface TicketAction {
  label: string
  nextStatus: KdsOrderStatus
  /** Dernière étape : le bouton reste sobre, le plat est déjà prêt. */
  isHandover: boolean
}

/** Étape suivante d'une commande, commune au ticket complet et au ticket compact. */
export function getTicketAction(order: KdsOrder): TicketAction {
  if (order.status === 'pending') {
    return { label: 'Lancer la cuisson', nextStatus: 'preparing', isHandover: false }
  }
  if (order.status === 'preparing') {
    return { label: 'Marquer prêt', nextStatus: 'ready', isHandover: false }
  }
  return {
    label: order.orderType === 'delivery' ? 'Remis au livreur' : 'Remis au client',
    nextStatus: 'delivered',
    isHandover: true,
  }
}
