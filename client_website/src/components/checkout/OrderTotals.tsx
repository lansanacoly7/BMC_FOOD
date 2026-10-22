import { formatFcfa } from '../../lib/format'

interface OrderTotalsProps {
  /** Total des plats. */
  subtotal: number
  /** Frais de livraison ; null : à confirmer par téléphone ; undefined : quartier pas encore choisi. */
  deliveryFee: number | null | undefined
}

/** Récapitulatif Plats + Livraison = Total à payer. */
export function OrderTotals({ subtotal, deliveryFee }: OrderTotalsProps) {
  const isFeeKnown = typeof deliveryFee === 'number'

  return (
    <dl className="space-y-1.5 rounded-2xl bg-zinc-100 px-4 py-3 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-600">Plats</dt>
        <dd className="tabular-nums">{formatFcfa(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-600">Livraison</dt>
        <dd className="tabular-nums">
          {deliveryFee === undefined ? '—' : deliveryFee === null ? 'À confirmer' : formatFcfa(deliveryFee)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-zinc-300 pt-1.5">
        <dt className="font-semibold">{isFeeKnown ? 'Total à payer' : 'Total hors livraison'}</dt>
        <dd aria-live="polite" className="font-display text-xl font-extrabold tabular-nums">
          {formatFcfa(subtotal + (isFeeKnown ? deliveryFee : 0))}
        </dd>
      </div>
    </dl>
  )
}
