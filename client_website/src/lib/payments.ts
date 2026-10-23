import type { PaymentMethod } from '../types'

/** Libellés des moyens de paiement, identiques à ceux de l'admin (admin_app/src/lib/labels.ts). */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces à la livraison',
  wave: 'Wave',
  orange_money: 'Orange Money',
}

/** Ordre d'affichage dans le sélecteur : les espèces d'abord, c'est le choix par défaut. */
export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'wave', 'orange_money']

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'cash'

/** Nom affiché comme marchand sur les écrans de paiement. */
export const MERCHANT_NAME = 'BMC Food'

/** Délai de la transition « Ouverture de Wave / Orange Money… » avant l'écran de confirmation. */
export const PAYMENT_REDIRECT_DELAY_MS = 900

/** Durée simulée du traitement après « Confirmer » / « Valider ». */
export const PAYMENT_PROCESSING_DELAY_MS = 1200

/** Moyens de paiement qui demandent une étape de paiement sur téléphone après la création de la commande. */
export function requiresMobilePayment(method: PaymentMethod): method is 'wave' | 'orange_money' {
  return method === 'wave' || method === 'orange_money'
}
