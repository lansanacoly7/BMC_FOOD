import { formatFcfa } from '../../lib/format'

interface OrderTotalsProps {
  /** Total des plats. */
  subtotal: number
  /** Frais de livraison ; null : à confirmer par téléphone ; undefined : quartier pas encore choisi. */
  deliveryFee: number | null | undefined
}

/** Récapitulatif Plats + Livraison = Total à payer (Univers Dark Luxury). */
export function OrderTotals({ subtotal, deliveryFee }: OrderTotalsProps) {
  const isFeeKnown = typeof deliveryFee === 'number'

  return (
    <dl className="space-y-2 rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3.5 text-sm shadow-xl">
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-400 font-medium">Plats commandés</dt>
        <dd className="tabular-nums font-bold text-white">{formatFcfa(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-400 font-medium">Frais de livraison</dt>
        <dd className="tabular-nums font-bold text-zinc-300">
          {deliveryFee === undefined ? '—' : deliveryFee === null ? 'À confirmer' : formatFcfa(deliveryFee)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-2.5">
        <dt className="font-extrabold text-white text-base">{isFeeKnown ? 'Total à payer' : 'Total hors livraison'}</dt>
        <dd aria-live="polite" className="font-display text-2xl font-black tabular-nums text-bmc-gold">
          {formatFcfa(subtotal + (isFeeKnown ? deliveryFee : 0))}
        </dd>
      </div>
    </dl>
  )
}
