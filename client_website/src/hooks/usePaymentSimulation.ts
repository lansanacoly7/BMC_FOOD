import { useEffect, useEffectEvent, useState } from 'react'
import { PAYMENT_PROCESSING_DELAY_MS, PAYMENT_REDIRECT_DELAY_MS } from '../lib/payments'

/** Étapes de l'écran de paiement simulé : ouverture de l'application, confirmation, traitement. */
export type PaymentPhase = 'opening' | 'confirm' | 'processing'

/**
 * Enchaîne les étapes d'un paiement simulé (démo, aucun débit réel) :
 * « Ouverture… » → écran de confirmation → « Paiement en cours… » → onPaid().
 * L'écran qui l'utilise doit être monté à l'ouverture : l'état repart alors de « opening ».
 */
export function usePaymentSimulation(onPaid: () => void) {
  const [phase, setPhase] = useState<PaymentPhase>('opening')
  const handlePaid = useEffectEvent(onPaid)

  useEffect(() => {
    if (phase === 'confirm') return
    const timer = window.setTimeout(
      () => (phase === 'opening' ? setPhase('confirm') : handlePaid()),
      phase === 'opening' ? PAYMENT_REDIRECT_DELAY_MS : PAYMENT_PROCESSING_DELAY_MS,
    )
    return () => window.clearTimeout(timer)
  }, [phase])

  return { phase, confirm: () => setPhase('processing') }
}
