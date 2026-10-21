import type { PaymentMethod } from '../types'

/** Libellés affichés pour chaque moyen de paiement. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces à la livraison',
  wave: 'Wave',
  orange_money: 'Orange Money',
}
