import { ArrowRight, LoaderCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { formatFcfa } from '../../lib/format'

interface OrderSubmitButtonProps {
  isSubmitting: boolean
  /** Montant affiché sur le bouton (indicatif : le serveur recalcule le total). */
  amount: number
  disabled?: boolean
  /** Sans onClick : bouton `submit` du formulaire de checkout. */
  onClick?: () => void
}

/**
 * Bouton principal d'envoi de la commande (charte p. 8) : orange braise, texte blanc,
 * état « Envoi… » de même largeur pendant la requête, désactivé tant que l'envoi est en cours.
 */
export function OrderSubmitButton({ isSubmitting, amount, disabled = false, onClick }: OrderSubmitButtonProps) {
  const isDisabled = disabled || isSubmitting

  return (
    <motion.button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isSubmitting}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-bmc-braise font-display text-lg font-bold text-white shadow-lg shadow-bmc-braise/40 transition-colors hover:bg-bmc-braise-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-charcoal disabled:cursor-not-allowed disabled:shadow-none [&:disabled:not([aria-busy=true])]:bg-[#e7b9a0]"
    >
      {isSubmitting ? (
        <>
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          Envoi…
        </>
      ) : (
        <>
          Commander · <span className="tabular-nums">{formatFcfa(amount)}</span>
          <ArrowRight className="size-5" aria-hidden="true" />
        </>
      )}
    </motion.button>
  )
}
