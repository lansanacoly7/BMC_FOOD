import type { OrderStatus, PaymentMethod, PaymentStatus } from '../types'

/** Libellés affichés pour chaque moyen de paiement. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces à la livraison',
  wave: 'Wave',
  orange_money: 'Orange Money',
}

/** Libellés affichés pour chaque état de paiement. */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Payé',
  pending: 'En attente',
  unpaid: 'À régler au livreur',
}

export interface StatusConfig {
  label: string
  shortLabel: string
  color: string
  bgLight: string
  border: string
  dotColor: string
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'En attente de validation',
    shortLabel: 'En attente',
    color: 'text-amber-400',
    bgLight: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  confirmed: {
    label: 'Commande confirmée',
    shortLabel: 'Confirmée',
    color: 'text-blue-400',
    bgLight: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    dotColor: 'bg-blue-400',
  },
  preparing: {
    label: 'En cuisine / Préparation',
    shortLabel: 'En cuisine',
    color: 'text-bmc-gold',
    bgLight: 'bg-bmc-gold/15',
    border: 'border-bmc-gold/40',
    dotColor: 'bg-bmc-gold',
  },
  delivering: {
    label: 'En cours de livraison',
    shortLabel: 'En livraison',
    color: 'text-[#1DC8F2]',
    bgLight: 'bg-[#1DC8F2]/15',
    border: 'border-[#1DC8F2]/30',
    dotColor: 'bg-[#1DC8F2]',
  },
  delivered: {
    label: 'Commande livrée',
    shortLabel: 'Livrée',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Commande annulée',
    shortLabel: 'Annulée',
    color: 'text-red-400',
    bgLight: 'bg-red-500/15',
    border: 'border-red-500/30',
    dotColor: 'bg-red-400',
  },
}
