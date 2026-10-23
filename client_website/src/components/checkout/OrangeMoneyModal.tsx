import { LoaderCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useRef } from 'react'
import { useModalDialog } from '../../hooks/useModalDialog'
import { usePaymentSimulation } from '../../hooks/usePaymentSimulation'
import { MERCHANT_NAME } from '../../lib/payments'
import { OrangeMoneyHomeBackdrop } from './OrangeMoneyHomeBackdrop'
import { SimulationBadge } from './SimulationBadge'

/** Montant au format de l'application Orange Money : 5500 → « 5 500 F ». */
const formatOrangeMoneyAmount = (amount: number) =>
  `${new Intl.NumberFormat('fr-FR').format(amount)}${String.fromCharCode(0xa0)}F`

interface OrangeMoneyModalProps {
  isOpen: boolean
  /** Le client abandonne (« Quitter ») : retour au site, la commande reste en « paiement en attente ». */
  onClose: () => void
  /** Montant recalculé par le serveur (`order.total_amount`), jamais le sous-total du panier. */
  amount: number
  /** Référence de la commande créée (`order.order_ref`), ex. « BMC-4821 ». */
  orderRef: string
  /** Paiement validé : afficher l'écran de confirmation de commande. */
  onConfirm: () => void
}

type OrangeMoneyScreenProps = Omit<OrangeMoneyModalProps, 'isOpen'>

function OrangeMoneyScreen({ onClose, amount, orderRef, onConfirm }: OrangeMoneyScreenProps) {
  const titleId = useId()
  const screenRef = useRef<HTMLDivElement>(null)
  const { phase, confirm } = usePaymentSimulation(onConfirm)
  const isProcessing = phase === 'processing'
  useModalDialog(true, isProcessing ? () => {} : onClose, screenRef)

  return (
    <motion.div
      ref={screenRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] text-white outline-none"
    >
      <OrangeMoneyHomeBackdrop amount={amount} orderRef={orderRef} />

      {/* Voile sombre de l'application quand la feuille de validation est ouverte. */}
      <AnimatePresence>
        {phase !== 'opening' && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70"
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 top-0 flex justify-center pt-[max(0.75rem,env(safe-area-inset-top))]">
        <SimulationBadge />
      </div>

      {phase === 'opening' && <p className="sr-only">Ouverture d’Orange Money…</p>}

      <AnimatePresence>
        {phase !== 'opening' && (
          <motion.section
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-[2rem] bg-zinc-900 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-2xl ring-1 ring-white/10"
          >
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-full bg-orange-money/40 text-xl font-bold"
              >
                {MERCHANT_NAME.charAt(0)}
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-xl font-bold">
                  {MERCHANT_NAME}
                </h2>
                <p className="font-semibold tracking-wide text-white/70">{orderRef}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/20 px-5 py-4">
              <span className="font-bold">Montant</span>
              <span className="text-lg font-bold tabular-nums text-orange-money">{formatOrangeMoneyAmount(amount)}</span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="h-14 rounded-2xl border-2 border-white text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-money disabled:opacity-40"
              >
                Quitter
              </button>
              <motion.button
                type="button"
                whileTap={isProcessing ? undefined : { scale: 0.97 }}
                onClick={confirm}
                disabled={isProcessing}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-orange-money text-lg font-bold text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-80"
              >
                {isProcessing ? (
                  <>
                    <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                    En cours…
                  </>
                ) : (
                  'Valider'
                )}
              </motion.button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * Écran de paiement Orange Money simulé (démo) : reprend l'écran « Paiement marchand » de l'application,
 * marchand BMC Food et montant déjà remplis. Aucun code secret n'est demandé : il se saisit uniquement
 * dans l'application Orange Money. À remplacer par le paiement réel une fois le compte marchand ouvert.
 */
export function OrangeMoneyModal({ isOpen, ...screenProps }: OrangeMoneyModalProps) {
  return <AnimatePresence>{isOpen && <OrangeMoneyScreen key="orange-money-payment" {...screenProps} />}</AnimatePresence>
}
