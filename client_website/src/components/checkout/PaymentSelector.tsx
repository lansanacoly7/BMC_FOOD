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
  cash: 'Préparez l’appoint pour le livreur.',
  wave: 'Après validation de la commande, Wave s’ouvre avec le montant et le marchand BMC Food déjà remplis.',
  orange_money:
    'Après validation de la commande, Orange Money s’ouvre avec le montant et le marchand BMC Food déjà remplis.',
}

interface PaymentSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
}

/**
 * Choix du moyen de paiement (module C3). Groupe de boutons radio natifs :
 * navigation au clavier avec les flèches et lecture correcte par les lecteurs d'écran.
 */
export function PaymentSelector({ value, onChange, disabled = false }: PaymentSelectorProps) {
  const groupName = useId()
  const hintId = useId()

  return (
    <fieldset disabled={disabled} aria-describedby={hintId} className="min-w-0">
      <legend className="mb-3 font-display text-lg font-bold">Moyen de paiement</legend>

      <div className="flex flex-col gap-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = method === value
          return (
            <motion.label
              key={method}
              whileTap={disabled ? undefined : { scale: 0.98 }}
              className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bmc-orange has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
                isSelected ? 'border-bmc-charcoal shadow-md' : 'border-zinc-200 hover:border-zinc-300'
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
                <span className="block font-semibold">{PAYMENT_METHOD_LABELS[method]}</span>
                <span className="block text-sm text-zinc-500">{DESCRIPTIONS[method]}</span>
              </span>
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                  isSelected ? 'border-bmc-charcoal bg-bmc-charcoal text-white' : 'border-zinc-300'
                }`}
              >
                {isSelected && <Check className="size-4" strokeWidth={3} />}
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
            className="rounded-xl bg-bmc-gold/15 px-4 py-3 text-sm font-medium text-bmc-charcoal"
          >
            {NEXT_STEP_HINTS[value]}
          </motion.p>
        </AnimatePresence>
      </div>
    </fieldset>
  )
}
