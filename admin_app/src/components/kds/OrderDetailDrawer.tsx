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
      className="fixed inset-0 z-50 flex justify-end bg-black/70 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className="w-full max-w-md h-full flex flex-col border-l border-[#262A33] bg-[#0F1115] text-[#E6E8EC] font-sans shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE DU TIROIR */}
        <div className="p-4 border-b border-[#262A33] bg-[#171A21] flex items-start justify-between gap-3 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2
                id="drawer-title"
                className="text-xl font-bold font-mono text-[#E6E8EC] tracking-tight"
              >
                {order.orderRef}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#0F1115] text-[#8B93A1] border border-[#262A33]">
                <TypeIcon className="size-3 text-[#8B93A1]" />
                <span>{typeConfig.label}</span>
              </span>
            </div>
            <p className="text-xs text-[#8B93A1] flex items-center gap-1.5">
              <Clock className="size-3 text-[#5D6472]" />
              Reçue à {formatDateTime(order.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33] transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* CORPS DU TIROIR */}
        <div className="p-4 flex-1 flex flex-col gap-4">
          {/* INFORMATIONS CLIENT & PAIEMENT */}
          <div className="p-3 rounded border border-[#262A33] bg-[#171A21] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#8B93A1] font-medium uppercase tracking-wider">
              <span>Client</span>
              <span className="font-mono text-[#E6E8EC]">
                {paymentMethodLabel} · {paymentStatusLabel}
              </span>
            </div>

            <div className="text-base font-bold text-[#E6E8EC]">{order.customerName}</div>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex items-center gap-2 text-xs font-medium text-[#E8A33D] hover:underline"
              >
                <Phone className="size-3.5" />
                <span>{order.phone}</span>
              </a>
            )}

            {order.address && (
              <div className="flex items-start gap-1.5 text-xs text-[#8B93A1]">
                <MapPin className="size-3.5 shrink-0 mt-0.5 text-[#5D6472]" />
                <span>{order.address}</span>
              </div>
            )}
          </div>

          {/* NOTE DU CLIENT */}
          {order.notes && (
            <div className="p-3 rounded border border-[#262A33] bg-[#171A21] flex items-start gap-2 text-xs text-[#E6E8EC]">
              <MessageSquare className="size-3.5 text-[#E8A33D] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#E8A33D] block mb-0.5">Note client :</span>
                <span className="italic leading-relaxed">« {order.notes} »</span>
              </div>
            </div>
          )}

          {/* DÉTAIL DES ARTICLES COMMANDÉS */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B93A1]">
              Articles ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div className="rounded border border-[#262A33] bg-[#171A21] divide-y divide-[#262A33] overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-2.5 flex items-start justify-between gap-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="px-1 py-0.2 rounded text-xs font-mono font-bold bg-[#0F1115] text-[#E8A33D] border border-[#262A33] shrink-0">
                      {item.quantity}×
                    </span>
                    <div>
                      <div className="font-medium text-[#E6E8EC] text-xs">{item.name}</div>
                      {item.notes && (
                        <div className="text-[11px] italic text-[#E8A33D] mt-0.5">
                          Note : {item.notes}
                        </div>
                      )}
                      {item.options && item.options.length > 0 && (
                        <div className="text-[11px] text-[#8B93A1] mt-0.5">
                          • {item.options.join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-[#8B93A1] text-xs font-medium text-right shrink-0">
                    {formatFcfa(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MONTANT TOTAL EN F CFA */}
          <div className="p-3 rounded border border-[#262A33] bg-[#171A21] flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B93A1] uppercase tracking-wider">
              Total TTC
            </span>
            <span className="text-lg font-bold font-mono text-[#E6E8EC]">
              {formatFcfa(order.totalAmount)}
            </span>
          </div>

          {/* ACTIONS D'IMPRESSION ET D'APPEL */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onPrintTicket(order)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded border border-[#262A33] bg-[#171A21] text-xs font-medium text-[#E6E8EC] hover:bg-[#262A33] transition-colors cursor-pointer"
            >
              <Printer className="size-3.5 text-[#8B93A1]" />
              <span>Imprimer le ticket</span>
            </button>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded border border-[#262A33] bg-[#171A21] text-xs font-medium text-[#E6E8EC] hover:bg-[#262A33] transition-colors"
              >
                <Phone className="size-3.5 text-[#8B93A1]" />
                <span>Appeler</span>
              </a>
            )}
          </div>

          {/* BOUTON DE TRANSITION DU WORKFLOW */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#262A33]">
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
                className="w-full py-2.5 rounded text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors bg-[#E8A33D] hover:bg-[#D69330] text-[#0F1115]"
              >
                {order.status === 'pending'
                  ? 'Lancer la préparation'
                  : order.status === 'preparing'
                  ? 'Marquer prêt'
                  : 'Remettre / Servir'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Annuler définitivement la commande ${order.orderRef} ?`)) {
                    onCancel?.(order.orderRef)
                    onClose()
                  }
                }}
                className="w-full py-1.5 rounded text-xs font-medium text-[#E04848] hover:bg-[#E04848]/10 cursor-pointer transition-colors"
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
