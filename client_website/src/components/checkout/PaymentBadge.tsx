import { Banknote } from 'lucide-react'
import type { PaymentMethod } from '../../types'

const SIZES = {
  md: { box: 'size-11', corner: 'rounded-xl', px: 44, icon: 'size-6' },
  lg: { box: 'size-14', corner: 'rounded-2xl', px: 56, icon: 'size-7' },
}

/** Logos officiels des opérateurs (public/images/payments/, 128 × 128 px). */
const LOGOS: Partial<Record<PaymentMethod, string>> = {
  wave: '/images/payments/wave.webp',
  orange_money: '/images/payments/orange-money.webp',
}

interface PaymentBadgeProps {
  method: PaymentMethod
  size?: keyof typeof SIZES
}

/** Pastille de reconnaissance d'un moyen de paiement : logo Wave ou Orange Money, billet pour les espèces. */
export function PaymentBadge({ method, size = 'md' }: PaymentBadgeProps) {
  const { box, corner, px, icon } = SIZES[size]
  const logo = LOGOS[method]

  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        width={px}
        height={px}
        decoding="async"
        // Le logo Wave est rond ; celui d'Orange Money est carré.
        className={`shrink-0 object-cover ${box} ${method === 'wave' ? 'rounded-full' : corner}`}
      />
    )
  }
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center bg-bmc-gold text-bmc-charcoal ${box} ${corner}`}>
      <Banknote className={icon} />
    </span>
  )
}
