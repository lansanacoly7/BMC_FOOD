import React, { useEffect } from 'react'
import {
  X,
  Printer,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { formatDateTime, formatFcfa } from '../../lib/formatters'
import type { KdsOrder } from '../../types/kds'
import { OrderTypePill, PaymentPill } from '../common/StatusPills'

interface OrderDetailDrawerProps {
  order: KdsOrder | null
  onClose: () => void
  onPrintTicket: (order: KdsOrder) => void
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  onClose,
  onPrintTicket,
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

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className="w-full max-w-lg h-full flex flex-col border-l shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
        style={{
          backgroundColor: 'var(--kds-bg-surface)',
          borderColor: 'var(--kds-border-default)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE DU TIROIR */}
        <div
          className="p-6 border-b flex items-start justify-between gap-4 sticky top-0 z-10"
          style={{
            backgroundColor: 'var(--kds-bg-surface-raised)',
            borderColor: 'var(--kds-border-default)',
          }}
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2
                id="drawer-title"
                className="text-2xl font-black font-tabular tracking-tight"
                style={{ color: 'var(--kds-text-primary)' }}
              >
                {order.orderRef}
              </h2>
              <OrderTypePill type={order.orderType} />
            </div>
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--kds-text-muted)' }}>
              <Clock size={13} />
              Reçue à {formatDateTime(order.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl border text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            style={{ borderColor: 'var(--kds-border-default)' }}
            title="Fermer le panneau"
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPS DU TIROIR */}
        <div className="p-6 flex-1 flex flex-col gap-6">
          {/* INFORMATIONS CLIENT */}
          <div
            className="p-4 rounded-xl border flex flex-col gap-3"
            style={{
              backgroundColor: 'var(--kds-bg-app)',
              borderColor: 'var(--kds-border-default)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--kds-text-muted)' }}>
                Client
              </span>
              <PaymentPill method={order.paymentMethod} status={order.paymentStatus} />
            </div>

            <div className="text-xl font-black" style={{ color: 'var(--kds-text-primary)' }}>
              {order.customerName}
            </div>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex items-center gap-2 text-sm font-bold text-amber-400 hover:underline"
              >
                <Phone size={16} />
                <span>{order.phone}</span>
              </a>
            )}

            {order.address && (
              <div className="flex items-start gap-2 text-sm font-medium" style={{ color: 'var(--kds-text-secondary)' }}>
                <MapPin size={16} className="shrink-0 mt-0.5 text-slate-400" />
                <span>{order.address}</span>
              </div>
            )}
          </div>

          {/* NOTES DE COMMANDE */}
          {order.notes && (
            <div
              className="p-4 rounded-xl border flex items-start gap-3"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.35)',
              }}
            >
              <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-amber-400 mb-0.5">
                  Consigne Cuisinier
                </div>
                <div className="text-sm font-bold text-amber-100">{order.notes}</div>
              </div>
            </div>
          )}

          {/* DÉTAIL DES ARTICLES & LIGNES */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--kds-text-muted)' }}>
              Articles commandés ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div
              className="rounded-xl border divide-y overflow-hidden"
              style={{
                backgroundColor: 'var(--kds-bg-app)',
                borderColor: 'var(--kds-border-default)',
              }}
            >
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="px-2 py-0.5 rounded text-sm font-black font-tabular shrink-0"
                      style={{
                        backgroundColor: 'rgba(252, 184, 0, 0.2)',
                        color: 'var(--kds-gold)',
                      }}
                    >
                      {item.quantity}×
                    </span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--kds-text-primary)' }}>
                        {item.name}
                      </div>
                      {item.notes && (
                        <div className="text-xs italic text-amber-300 mt-0.5">Note : {item.notes}</div>
                      )}
                      {item.options && item.options.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">+ {item.options.join(', ')}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-sm font-bold font-tabular text-right shrink-0" style={{ color: 'var(--kds-text-secondary)' }}>
                    {formatFcfa(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL & MODE DE RÈGLEMENT */}
          <div
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{
              backgroundColor: 'var(--kds-bg-surface-raised)',
              borderColor: 'var(--kds-border-default)',
            }}
          >
            <span className="text-base font-bold" style={{ color: 'var(--kds-text-secondary)' }}>
              Montant total TTC
            </span>
            <span className="text-2xl font-black font-tabular" style={{ color: 'var(--kds-text-primary)' }}>
              {formatFcfa(order.totalAmount)}
            </span>
          </div>

          {/* BOUTONS D'ACTION SECONDAIRE */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onPrintTicket(order)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              style={{ borderColor: 'var(--kds-border-default)' }}
            >
              <Printer size={18} />
              <span>Imprimer ticket</span>
            </button>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                style={{ borderColor: 'var(--kds-border-default)' }}
              >
                <Phone size={18} />
                <span>Appeler</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
