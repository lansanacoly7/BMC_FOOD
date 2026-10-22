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
 * Bouton principal d'envoi de la commande (Univers Dark Luxury).
 * Dégradé Or BMC vibrant (#FCB800) avec texte noir à fort contraste (règle absolue de la charte).
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
      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-sm sm:text-base font-black uppercase tracking-wider text-black shadow-xl shadow-bmc-gold/30 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none cursor-pointer transition-all"
    >
      {isSubmitting ? (
        <>
          <LoaderCircle className="size-5 animate-spin text-black" aria-hidden="true" />
          <span>Envoi en cours…</span>
        </>
      ) : (
        <>
          <span>Confirmer la commande</span>
          <span>·</span>
          <span className="tabular-nums font-black">{formatFcfa(amount)}</span>
          <ArrowRight className="size-5 stroke-[3] text-black" aria-hidden="true" />
        </>
      )}
    </motion.button>
  )
}
