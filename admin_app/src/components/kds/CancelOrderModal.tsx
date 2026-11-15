import React, { useState } from 'react'
import { AlertOctagon, AlertTriangle, X } from 'lucide-react'
import { formatFcfa } from '../../lib/formatters'
import type { KdsOrder } from '../../types/kds'

interface CancelOrderModalProps {
  order: KdsOrder | null
  isOpen: boolean
  onClose: () => void
  onConfirmCancel: (orderRef: string, reason: string) => void | Promise<void>
}

const COMMON_REASONS = [
  "Rupture d'ingrédients en cuisine",
  'Client injoignable par téléphone',
  'Erreur de commande ou doublon client',
  'Délai de livraison trop long pour le client',
  "Demande d'annulation directe du client",
  'Autre motif',
]

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customText, setCustomText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  if (!isOpen || !order) return null

  const isPaid = order.paymentStatus === 'paid'
  const isOther = selectedReason === 'Autre motif'

  // Le motif final transmis
  const finalReason = isOther
    ? customText.trim()
    : selectedReason
    ? customText.trim()
      ? `${selectedReason} : ${customText.trim()}`
      : selectedReason
    : ''

  const canSubmit = Boolean(finalReason) && !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      await onConfirmCancel(order.orderRef, finalReason)
      onClose()
      setSelectedReason('')
      setCustomText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const paymentLabel =
    order.paymentMethod === 'wave'
      ? 'Wave'
      : order.paymentMethod === 'orange_money'
      ? 'Orange Money'
      : 'Espèces'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 text-ink shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE */}
        <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bad/15 text-bad">
              <AlertOctagon className="size-5" />
            </div>
            <div>
              <h3 id="cancel-modal-title" className="font-display text-lg font-bold text-ink">
                Annuler la commande {order.orderRef}
              </h3>
              <p className="text-xs text-ink-soft">
                Client : <strong className="text-ink">{order.customerName}</strong> ({order.phone || 'Pas de numéro'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-raised hover:text-ink cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ALERTE REMBOURSEMENT SI COMMANDE DÉJÀ PAYÉE */}
        {isPaid && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-amber-300 text-sm">
                  Remboursement client à effectuer
                </h4>
                <p className="text-amber-200/90 leading-relaxed">
                  Cette commande a déjà été encaissée par <strong>{paymentLabel}</strong> pour un montant de{' '}
                  <strong className="text-white">{formatFcfa(order.totalAmount)}</strong>.
                </p>
                <p className="font-semibold text-white pt-1">
                  Veuillez restituer {formatFcfa(order.totalAmount)} à {order.customerName} ({order.phone}).
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">
              Motif de l'annulation <span className="text-bad">*</span>
            </label>

            <div className="grid grid-cols-1 gap-2">
              {COMMON_REASONS.map((reason) => {
                const isSelected = selectedReason === reason
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-bmc-gold bg-bmc-gold/10 text-white font-semibold'
                        : 'border-line bg-canvas text-ink-soft hover:bg-raised hover:text-ink'
                    }`}
                  >
                    <span
                      className={`size-3 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-bmc-gold bg-bmc-gold' : 'border-line'
                      }`}
                    >
                      {isSelected && <span className="size-1 rounded-full bg-black" />}
                    </span>
                    <span>{reason}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-cancel-reason"
              className="block text-xs font-semibold text-ink-soft mb-1"
            >
              {isOther ? 'Précisez obligatoirement le motif :' : 'Précision facultative :'}
            </label>
            <textarea
              id="custom-cancel-reason"
              rows={2}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={
                isOther
                  ? 'Indiquez la raison détaillée...'
                  : 'Détail supplémentaire pour l’équipe ou le client...'
              }
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-bmc-gold focus:outline-none focus:ring-1 focus:ring-bmc-gold"
              required={isOther}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-line px-4 py-2.5 text-xs font-semibold text-ink-soft hover:bg-raised hover:text-ink transition-colors cursor-pointer"
            >
              Conserver la commande
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-1.5 rounded-lg bg-bad px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <AlertOctagon className="size-4" />
              <span>{isSubmitting ? 'Annulation...' : "Confirmer l'annulation"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
