import { LoaderCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useRef } from 'react'
import { useModalDialog } from '../../hooks/useModalDialog'
import { usePaymentSimulation } from '../../hooks/usePaymentSimulation'
import { MERCHANT_NAME } from '../../lib/payments'
import { SimulationBadge } from './SimulationBadge'
import { WaveHomeBackdrop } from './WaveHomeBackdrop'

/** Montant au format de l'application Wave : 5500 → « 5.500F ». */
const formatWaveAmount = (amount: number) => `${new Intl.NumberFormat('de-DE').format(amount)}F`

interface WavePaymentModalProps {
  isOpen: boolean
  /** Le client abandonne : retour au site, la commande reste enregistrée en « paiement en attente ». */
  onClose: () => void
  /** Montant recalculé par le serveur (`order.total_amount`), jamais le sous-total du panier. */
  amount: number
  /** Référence de la commande créée (`order.order_ref`), ex. « BMC-4821 ». */
  orderRef: string
  /** Paiement confirmé : afficher l'écran de confirmation de commande. */
  onConfirm: () => void
}

type WaveScreenProps = Omit<WavePaymentModalProps, 'isOpen'>

function WaveScreen({ onClose, amount, orderRef, onConfirm }: WaveScreenProps) {
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
      <WaveHomeBackdrop />

      {/* Voile léger de l'application quand la feuille de confirmation est ouverte : l'accueil reste lisible. */}
      <AnimatePresence>
        {phase !== 'opening' && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/15"
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 top-0 flex justify-center pt-[max(0.75rem,env(safe-area-inset-top))]">
        <SimulationBadge />
      </div>

      {phase === 'opening' && <p className="sr-only">Ouverture de Wave…</p>}

      <AnimatePresence>
        {phase !== 'opening' && (
          <motion.section
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-[1.75rem] bg-white px-7 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 text-bmc-charcoal"
          >
            <div className="relative flex items-center justify-center">
              <h2 id={titleId} className="text-[1.35rem] font-bold">
                Confirmer le paiement
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="Annuler le paiement"
                className="absolute -right-2 grid size-10 place-items-center rounded-full text-slate-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-wave disabled:opacity-40"
              >
                <X className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <p className="sr-only">Commande {orderRef}</p>
            <dl className="mt-7 divide-y divide-zinc-200 text-[1.1rem]">
              <div className="flex justify-between gap-4 pb-5">
                <dt className="text-zinc-500">Marchand</dt>
                <dd>{MERCHANT_NAME}</dd>
              </div>
              <div className="flex justify-between gap-4 pt-5">
                <dt className="text-zinc-500">Total</dt>
                <dd className="tabular-nums">{formatWaveAmount(amount)}</dd>
              </div>
            </dl>

            <motion.button
              type="button"
              whileTap={isProcessing ? undefined : { scale: 0.97 }}
              onClick={confirm}
              disabled={isProcessing}
              className="mt-9 flex h-[3.75rem] w-full items-center justify-center gap-2 rounded-full bg-wave text-xl font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wave-indigo disabled:opacity-80"
            >
              {isProcessing ? (
                <>
                  <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
                  Paiement en cours…
                </>
              ) : (
                'Confirmer'
              )}
            </motion.button>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * Écran de paiement Wave simulé (démo) : reprend l'écran « Confirmer le paiement » de l'application,
 * marchand BMC Food et montant déjà remplis. À remplacer par la redirection Wave réelle une fois le compte marchand ouvert.
 */
export function WavePaymentModal({ isOpen, ...screenProps }: WavePaymentModalProps) {
  return <AnimatePresence>{isOpen && <WaveScreen key="wave-payment" {...screenProps} />}</AnimatePresence>
}
