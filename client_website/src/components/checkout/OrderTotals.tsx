import { formatFcfa } from '../../lib/format'

interface OrderTotalsProps {
  /** Total des plats. */
  subtotal: number
  /** Frais de livraison ; null : à confirmer par téléphone ; undefined : quartier pas encore choisi (ou retrait). */
  deliveryFee: number | null | undefined
  /** Commande à emporter : pas de frais de livraison. */
  isPickup?: boolean
}

/** Récapitulatif Plats + Livraison = Total à payer. */
export function OrderTotals({ subtotal, deliveryFee, isPickup = false }: OrderTotalsProps) {
  const isFeeKnown = isPickup || typeof deliveryFee === 'number'
  const fee = !isPickup && typeof deliveryFee === 'number' ? deliveryFee : 0

  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-400">Plats</dt>
        <dd className="tabular-nums font-semibold text-white">{formatFcfa(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-400">{isPickup ? 'Retrait au restaurant' : 'Livraison'}</dt>
        <dd className="tabular-nums font-semibold text-zinc-200">
          {isPickup
            ? 'Sans frais'
            : deliveryFee === undefined
              ? 'Selon le quartier'
              : deliveryFee === null
                ? 'À confirmer'
                : formatFcfa(deliveryFee)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-3">
        <dt className="text-base font-semibold text-white">{isFeeKnown ? 'Total' : 'Total hors livraison'}</dt>
        <dd aria-live="polite" className="font-display text-2xl font-bold tabular-nums text-bmc-gold">
          {formatFcfa(subtotal + fee)}
        </dd>
      </div>
    </dl>
  )
}
