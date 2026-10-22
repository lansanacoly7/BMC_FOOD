import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId } from 'react'
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '../../lib/payments'
import type { PaymentMethod } from '../../types'
import { PaymentBadge } from './PaymentBadge'

const DESCRIPTIONS: Record<PaymentMethod, string> = {
  cash: 'Vous payez le livreur à la réception.',
  wave: 'Paiement depuis l’application Wave.',
  orange_money: 'Paiement depuis l’application Orange Money.',
}

/** Message affiché sous l'option choisie : ce que le client doit faire ensuite. */
const NEXT_STEP_HINTS: Record<PaymentMethod, string> = {
  cash: 'Préparez l’appoint pour le livreur à son arrivée.',
  wave: 'Après validation, l’écran de paiement Wave s’ouvre avec le montant et le marchand BMC Food.',
  orange_money:
    'Après validation, l’écran Orange Money s’ouvre avec la démarche #144#391#.',
}

interface PaymentSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
}

/**
 * Choix du moyen de paiement (Univers Dark Luxury).
 * Affiche Wave, Orange Money et Espèces avec un contraste soigné et badge officiel.
 */
export function PaymentSelector({ value, onChange, disabled = false }: PaymentSelectorProps) {
  const groupName = useId()
  const hintId = useId()

  return (
    <fieldset disabled={disabled} aria-describedby={hintId} className="min-w-0">
      <legend className="mb-3 font-display text-base font-extrabold text-white">Moyen de paiement</legend>

      <div className="flex flex-col gap-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = method === value
          return (
            <motion.label
              key={method}
              whileTap={disabled ? undefined : { scale: 0.98 }}
              className={`relative flex cursor-pointer items-center gap-3.5 rounded-2xl border p-3.5 transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bmc-gold has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
                isSelected
                  ? 'border-bmc-gold bg-zinc-800/90 shadow-lg shadow-bmc-gold/15 ring-1 ring-bmc-gold/50'
                  : 'border-white/10 bg-zinc-950/70 hover:border-white/25 hover:bg-zinc-900'
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
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-sm text-white">{PAYMENT_METHOD_LABELS[method]}</span>
                <span className="block text-xs text-zinc-400 mt-0.5">{DESCRIPTIONS[method]}</span>
              </span>
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all ${
                  isSelected ? 'border-bmc-gold bg-bmc-gold text-black shadow-sm' : 'border-white/20'
                }`}
              >
                {isSelected && <Check className="size-3.5 stroke-[3]" />}
              </span>
            </motion.label>
          )
        })}
      </div>

      {/* Conteneur stable : une zone aria-live doit exister avant son changement pour être annoncée. */}
      <div id={hintId} aria-live="polite" className="mt-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl bg-zinc-950 border border-bmc-gold/30 px-3.5 py-2.5 text-xs font-medium text-amber-200/90"
          >
            {NEXT_STEP_HINTS[value]}
          </motion.p>
        </AnimatePresence>
      </div>
    </fieldset>
  )
}
