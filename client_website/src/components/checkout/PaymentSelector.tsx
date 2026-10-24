import { Check } from 'lucide-react'
import { useId } from 'react'
import { PAYMENT_METHODS } from '../../lib/payments'
import type { PaymentMethod } from '../../types'
import { PaymentBadge } from './PaymentBadge'

const SHORT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
}

/** Message affiché sous les choix : ce que le client doit faire ensuite, selon livraison ou retrait. */
function nextStep(method: PaymentMethod, isPickup: boolean): string {
  if (method === 'cash') {
    return isPickup
      ? 'Vous réglez en espèces au restaurant, au retrait de votre commande.'
      : 'Vous payez le livreur à la réception : préparez l’appoint.'
  }
  if (method === 'wave') return 'Après validation, l’écran de paiement Wave s’ouvre avec le montant.'
  return 'Après validation, l’écran Orange Money s’ouvre avec la démarche #144#391#.'
}

interface PaymentSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
  /** Commande à emporter : les textes parlent du restaurant plutôt que du livreur. */
  isPickup?: boolean
}

/** Choix du moyen de paiement : trois tuiles côte à côte (Espèces, Wave, Orange Money), explication dessous. */
export function PaymentSelector({ value, onChange, disabled = false, isPickup = false }: PaymentSelectorProps) {
  const groupName = useId()
  const hintId = useId()

  return (
    <fieldset disabled={disabled} aria-describedby={hintId} className="min-w-0">
      <legend className="mb-3 font-display text-lg font-bold text-white">Paiement</legend>

      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = method === value
          return (
            <label
              key={method}
              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bmc-gold has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
                isSelected ? 'border-bmc-gold bg-bmc-gold/10' : 'border-white/10 bg-zinc-950 hover:border-white/25'
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={method}
                checked={isSelected}
                onChange={() => onChange(method)}
                className="sr-only"
              />
              <PaymentBadge method={method} />
              <span className="text-xs font-semibold leading-tight text-white sm:text-sm">{SHORT_LABELS[method]}</span>
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-bmc-gold text-black"
                >
                  <Check className="size-3" />
                </span>
              )}
            </label>
          )
        })}
      </div>

      {/* Conteneur stable : une zone aria-live doit exister avant son changement pour être annoncée. */}
      <p id={hintId} aria-live="polite" className="mt-3 text-sm leading-relaxed text-zinc-300">
        {nextStep(value, isPickup)}
      </p>
    </fieldset>
  )
}
