import { ArrowRight, LoaderCircle } from 'lucide-react'
import { formatFcfa } from '../../lib/format'

interface OrderSubmitButtonProps {
  isSubmitting: boolean
  /** Montant affiché sur le bouton (indicatif : le serveur recalcule le total). */
  amount: number
  disabled?: boolean
  /** Sans onClick : bouton `submit` du formulaire de checkout. */
  onClick?: () => void
}

/** Bouton principal d'envoi de la commande : or BMC, texte noir à fort contraste (règle de la charte). */
export function OrderSubmitButton({ isSubmitting, amount, disabled = false, onClick }: OrderSubmitButtonProps) {
  const isDisabled = disabled || isSubmitting

  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isSubmitting}
      className="flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-bmc-gold font-display text-base font-bold text-black transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isSubmitting ? (
        <>
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          <span>Envoi en cours…</span>
        </>
      ) : (
        <>
          <span>Confirmer la commande</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{formatFcfa(amount)}</span>
          <ArrowRight className="size-5" aria-hidden="true" />
        </>
      )}
    </button>
  )
}
