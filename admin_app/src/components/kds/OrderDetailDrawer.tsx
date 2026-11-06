import React, { useEffect } from 'react'
import {
  X,
  Printer,
  Phone,
  MapPin,
  Clock,
  Bike,
  Utensils,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react'
import { formatDateTime, formatFcfa } from '../../lib/formatters'
import type { KdsOrder, KdsOrderStatus, OrderType } from '../../types/kds'

interface OrderDetailDrawerProps {
  order: KdsOrder | null
  onClose: () => void
  onPrintTicket: (order: KdsOrder) => void
  onTransition?: (orderRef: string, nextStatus: KdsOrderStatus) => void
  onCancel?: (orderRef: string) => void
}

const TYPE_CONFIG: Record<
  OrderType,
  { label: string; icon: React.FC<{ className?: string }> }
> = {
  delivery: { label: 'Livraison', icon: Bike },
  takeaway: { label: 'À emporter', icon: ShoppingBag },
  dine_in: { label: 'Sur place', icon: Utensils },
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  onClose,
  onPrintTicket,
  onTransition,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!order) return null

  const typeConfig = TYPE_CONFIG[order.orderType] || TYPE_CONFIG.delivery
  const TypeIcon = typeConfig.icon

  const paymentMethodLabel =
    order.paymentMethod === 'wave'
      ? 'Wave'
      : order.paymentMethod === 'orange_money'
      ? 'Orange Money'
      : 'Espèces'

  const paymentStatusLabel =
    order.paymentStatus === 'paid' ? 'Payée' : 'Non payée'

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className="w-full max-w-md h-full flex flex-col border-l border-line bg-canvas text-ink font-sans shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE DU TIROIR */}
        <div className="p-4 border-b border-line bg-surface flex items-start justify-between gap-3 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2
                id="drawer-title"
                className="font-display text-2xl font-bold tabular-nums text-ink"
              >
                {order.orderRef}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-canvas text-ink-soft border border-line">
                <TypeIcon className="size-3 text-ink-soft" />
                <span>{typeConfig.label}</span>
              </span>
            </div>
            <p className="text-xs text-ink-soft flex items-center gap-1.5">
              <Clock className="size-3 text-ink-faint" />
              Reçue à {formatDateTime(order.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-raised transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* CORPS DU TIROIR */}
        <div className="p-4 flex-1 flex flex-col gap-4">
          {/* INFORMATIONS CLIENT & PAIEMENT */}
          <div className="p-3 rounded-lg border border-line bg-surface flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-ink-soft font-medium">
              <span>Client</span>
              <span className="tabular-nums text-ink">
                {paymentMethodLabel} · {paymentStatusLabel}
              </span>
            </div>

            <div className="text-base font-bold text-ink">{order.customerName}</div>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex items-center gap-2 text-xs font-medium text-bmc-gold hover:underline"
              >
                <Phone className="size-3.5" />
                <span>{order.phone}</span>
              </a>
            )}

            {order.address && (
              <div className="flex items-start gap-1.5 text-xs text-ink-soft">
                <MapPin className="size-3.5 shrink-0 mt-0.5 text-ink-faint" />
                <span>{order.address}</span>
              </div>
            )}
          </div>

          {/* NOTE DU CLIENT */}
          {order.notes && (
            <div className="p-3 rounded-lg border border-line bg-surface flex items-start gap-2 text-xs text-ink">
              <MessageSquare className="size-3.5 text-bmc-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-bmc-gold block mb-0.5">Note client :</span>
                <span className="italic leading-relaxed">« {order.notes} »</span>
              </div>
            </div>
          )}

          {/* DÉTAIL DES ARTICLES COMMANDÉS */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-ink-soft">
              Articles ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div className="rounded-lg border border-line bg-surface divide-y divide-line overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-2.5 flex items-start justify-between gap-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="px-1 py-0.2 rounded-lg text-xs tabular-nums font-bold bg-canvas text-bmc-gold border border-line shrink-0">
                      {item.quantity}×
                    </span>
                    <div>
                      <div className="font-medium text-ink text-xs">{item.name}</div>
                      {item.notes && (
                        <div className="text-[13px] italic text-bmc-gold mt-0.5">
                          Note : {item.notes}
                        </div>
                      )}
                      {item.options && item.options.length > 0 && (
                        <div className="text-[13px] text-ink-soft mt-0.5">
                          • {item.options.join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tabular-nums text-ink-soft text-xs font-medium text-right shrink-0">
                    {formatFcfa(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MONTANT TOTAL EN F CFA */}
          <div className="p-3 rounded-lg border border-line bg-surface flex items-center justify-between">
            <span className="text-xs font-medium text-ink-soft">
              Total TTC
            </span>
            <span className="font-display text-xl font-bold tabular-nums text-price">
              {formatFcfa(order.totalAmount)}
            </span>
          </div>

          {/* ACTIONS D'IMPRESSION ET D'APPEL */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onPrintTicket(order)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-line bg-surface text-xs font-medium text-ink hover:bg-raised transition-colors cursor-pointer"
            >
              <Printer className="size-3.5 text-ink-soft" />
              <span>Imprimer le ticket</span>
            </button>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-line bg-surface text-xs font-medium text-ink hover:bg-raised transition-colors"
              >
                <Phone className="size-3.5 text-ink-soft" />
                <span>Appeler</span>
              </a>
            )}
          </div>

          {/* BOUTON DE TRANSITION DU WORKFLOW */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  const next: KdsOrderStatus =
                    order.status === 'pending'
                      ? 'preparing'
                      : order.status === 'preparing'
                      ? 'ready'
                      : 'delivered'
                  onTransition?.(order.orderRef, next)
                  onClose()
                }}
                className="w-full h-12 rounded-lg font-display text-[15px] font-bold cursor-pointer transition-colors bg-bmc-gold hover:bg-[#E5A700] text-bmc-charcoal"
              >
                {order.status === 'pending'
                  ? 'Lancer la cuisson'
                  : order.status === 'preparing'
                  ? 'Marquer prêt'
                  : order.orderType === 'delivery'
                  ? 'Remis au livreur'
                  : 'Remis au client'}
              </button>

              <button
                type="button"
                onClick={() => {
                  onCancel?.(order.orderRef)
                  onClose()
                }}
                className="w-full py-1.5 rounded-lg text-xs font-medium text-bad hover:bg-bad-soft cursor-pointer transition-colors"
              >
                Annuler la commande
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
