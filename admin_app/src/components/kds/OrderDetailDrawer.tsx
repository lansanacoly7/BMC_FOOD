import React, { useEffect } from 'react'
import {
  X,
  Printer,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  Bike,
  Utensils,
  ShoppingBag,
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

const TYPE_ICONS: Record<OrderType, React.FC<{ className?: string }>> = {
  delivery: Bike,
  takeaway: ShoppingBag,
  dine_in: Utensils,
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  onClose,
  onPrintTicket,
  onTransition,
  onCancel,
}) => {
  // Raccourci Échap pour fermer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!order) return null

  const TypeIcon = TYPE_ICONS[order.orderType] || Bike
  const typeLabel =
    order.orderType === 'delivery'
      ? 'Livraison'
      : order.orderType === 'takeaway'
      ? 'À emporter'
      : 'Sur place'

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className="w-full max-w-lg h-full flex flex-col border-l border-[#1A212D] bg-[#0E1218] shadow-2xl overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE DU TIROIR */}
        <div className="p-5 border-b border-[#1A212D] bg-[#121720] flex items-start justify-between gap-4 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2
                id="drawer-title"
                className="text-2xl font-black font-mono text-white tracking-tight"
              >
                {order.orderRef}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#1A212D] text-[#CBD5E1] border border-[#273244]">
                <TypeIcon className="size-3 text-[#7E8B9F]" />
                <span>{typeLabel}</span>
              </span>
            </div>
            <p className="text-xs font-medium text-[#7E8B9F] flex items-center gap-1.5">
              <Clock className="size-3.5 text-[#5A6779]" />
              Reçue à {formatDateTime(order.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#7E8B9F] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* CORPS DU TIROIR */}
        <div className="p-5 flex-1 flex flex-col gap-5">
          {/* INFORMATIONS CLIENT */}
          <div className="p-4 rounded-xl border border-[#1A212D] bg-[#11161F] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-[#7E8B9F] font-bold uppercase tracking-wider">
              <span>Client</span>
              <span className="font-mono text-[#CBD5E1]">
                {order.paymentMethod.toUpperCase()} ({order.paymentStatus === 'paid' ? 'Payé' : 'À payer'})
              </span>
            </div>

            <div className="text-lg font-bold text-white">{order.customerName}</div>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex items-center gap-2 text-xs font-semibold text-[#F5B301] hover:underline"
              >
                <Phone className="size-3.5" />
                <span>{order.phone}</span>
              </a>
            )}

            {order.address && (
              <div className="flex items-start gap-2 text-xs text-[#8C98AA]">
                <MapPin className="size-3.5 shrink-0 mt-0.5 text-[#5A6779]" />
                <span>{order.address}</span>
              </div>
            )}
          </div>

          {/* NOTE CLIENT (Si présente) */}
          {order.notes && (
            <div className="p-3.5 rounded-xl border border-[#2B3545] bg-[#151B24] flex items-start gap-2.5 text-xs text-[#E2E8F0]">
              <AlertCircle className="size-4 text-[#F5B301] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#F5B301] block mb-0.5">Instruction :</span>
                <span className="italic leading-relaxed">« {order.notes} »</span>
              </div>
            </div>
          )}

          {/* ARTICLES COMMANDÉS */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7E8B9F]">
              Articles à préparer ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div className="rounded-xl border border-[#1A212D] bg-[#11161F] divide-y divide-[#1A212D] overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-[#1A212D] text-white border border-[#273244] shrink-0">
                      {item.quantity}×
                    </span>
                    <div>
                      <div className="font-bold text-white text-sm">{item.name}</div>
                      {item.notes && (
                        <div className="text-[11px] italic text-[#F5B301] mt-0.5">
                          Note : {item.notes}
                        </div>
                      )}
                      {item.options && item.options.length > 0 && (
                        <div className="text-[11px] text-[#7E8B9F] mt-0.5">
                          • {item.options.join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-[#8C98AA] font-bold text-right shrink-0">
                    {formatFcfa(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MONTANT TOTAL */}
          <div className="p-4 rounded-xl border border-[#1A212D] bg-[#121720] flex items-center justify-between">
            <span className="text-xs font-bold text-[#7E8B9F] uppercase tracking-wider">
              Total commande
            </span>
            <span className="text-xl font-black font-mono text-white">
              {formatFcfa(order.totalAmount)}
            </span>
          </div>

          {/* BOUTONS D'IMPRESSION ET D'APPEL */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onPrintTicket(order)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#1E2634] bg-[#141A23] font-bold text-xs text-white hover:bg-[#1C2432] transition-colors cursor-pointer"
            >
              <Printer className="size-3.5 text-[#7E8B9F]" />
              <span>Imprimer ticket</span>
            </button>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#1E2634] bg-[#141A23] font-bold text-xs text-white hover:bg-[#1C2432] transition-colors"
              >
                <Phone className="size-3.5 text-[#7E8B9F]" />
                <span>Appeler client</span>
              </a>
            )}
          </div>

          {/* ACTIONS D'AVANCEMENT DU WORKFLOW */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#1A212D]">
              <div className="flex gap-2">
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
                  className={`flex-1 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider cursor-pointer transition-colors ${
                    order.status === 'ready' || order.status === 'delivering'
                      ? 'bg-[#22C55E] hover:bg-[#16A34A] text-black'
                      : 'bg-[#F5B301] hover:bg-[#E5A700] text-black'
                  }`}
                >
                  {order.status === 'pending'
                    ? 'Lancer cuisson'
                    : order.status === 'preparing'
                    ? 'Marquer prête'
                    : 'Remettre / Servir'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Confirmer l'annulation de la commande ${order.orderRef} ?`)) {
                    onCancel?.(order.orderRef)
                    onClose()
                  }
                }}
                className="w-full py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors"
              >
                Annuler commande
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
