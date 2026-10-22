import { ChevronLeft, ShoppingBasket, SquarePen } from 'lucide-react'
import { MERCHANT_NAME } from '../../lib/payments'

interface OrangeMoneyHomeBackdropProps {
  amount: number
  orderRef: string
}

/**
 * Écran « QR & Paiement marchand » de l'application Orange Money reproduit en arrière-plan
 * de l'écran de paiement simulé (démo). Décoratif uniquement : rien n'y est cliquable et le solde est masqué.
 */
export function OrangeMoneyHomeBackdrop({ amount, orderRef }: OrangeMoneyHomeBackdropProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-black px-4 text-white select-none">
      <p className="flex items-center gap-3 pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.5rem))] text-lg font-bold">
        <ChevronLeft className="size-7" />
        QR & Paiement marchand
      </p>

      <div className="mt-8 flex items-center gap-4 px-2">
        <ShoppingBasket className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{MERCHANT_NAME}</p>
          <p className="font-semibold tracking-wide text-white/70">{orderRef}</p>
        </div>
        <SquarePen className="size-7 shrink-0" />
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg border border-white/25 px-5 py-4 text-xl font-bold">
        <span className="tabular-nums">{amount}</span>
        <span className="text-white/60">CFA</span>
      </div>

      <p className="mt-4 flex items-center gap-2 font-bold">
        <img src="/images/payments/orange-money.webp" alt="" width={28} height={28} className="size-7 rounded" />
        Solde <span className="text-orange-money">●●●● F</span>
      </p>
    </div>
  )
}
