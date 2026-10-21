import { formatFcfa } from '../lib/format'
import type { Order } from '../types'

/** État de l'autorisation des notifications, ou `unsupported` si le navigateur ne les gère pas. */
export type NotificationAccess = NotificationPermission | 'unsupported'

/** Notifications affichées, par référence de commande, pour pouvoir les fermer à l'acquittement. */
const openNotifications = new Map<string, Notification>()

export function getNotificationAccess(): NotificationAccess {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

/**
 * Demande l'autorisation d'afficher des notifications.
 * À appeler directement dans un gestionnaire de clic : Firefox et Safari refusent sinon.
 */
export async function requestNotificationAccess(): Promise<NotificationAccess> {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/**
 * Affiche la notification système « 🔔 Nouvelle commande BMC-XXXX » / « Montant : X XXX F CFA ».
 * Renvoie false si elle n'a pas pu être affichée (autorisation absente ou navigateur incompatible).
 */
export function notifyNewOrder(order: Pick<Order, 'order_ref' | 'total_amount'>): boolean {
  if (getNotificationAccess() !== 'granted') return false

  try {
    const notification = new Notification(`🔔 Nouvelle commande ${order.order_ref}`, {
      body: `Montant : ${formatFcfa(order.total_amount)}`,
      tag: order.order_ref,
      requireInteraction: true,
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    notification.onclose = () => openNotifications.delete(order.order_ref)
    openNotifications.set(order.order_ref, notification)
    return true
  } catch {
    // Chrome Android n'autorise les notifications que via un service worker :
    // la sonnerie et la fenêtre d'alerte restent alors les canaux d'alerte.
    return false
  }
}

/** Ferme les notifications système des commandes prises en charge. */
export function closeOrderNotifications(orderRefs: string[]): void {
  for (const ref of orderRefs) {
    openNotifications.get(ref)?.close()
    openNotifications.delete(ref)
  }
}
