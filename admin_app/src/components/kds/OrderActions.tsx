import React, { useEffect, useRef, useState } from 'react'
import {
  MoreVertical,
  Printer,
  Phone,
  XCircle,
  Eye,
} from 'lucide-react'

import type { KdsOrder } from '../../types/kds'

interface OrderActionsProps {
  order: KdsOrder
  onViewDetails: () => void
  onCancelOrder: () => void
  onPrintTicket: () => void
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  order,
  onViewDetails,
  onCancelOrder,
  onPrintTicket,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="Options de la commande"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-56 rounded-xl shadow-2xl border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{
            backgroundColor: 'var(--kds-bg-surface-overlay)',
            borderColor: 'var(--kds-border-default)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.7)',
          }}
          role="menu"
        >
          {/* Détails */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onViewDetails()
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 text-left transition-colors"
            role="menuitem"
          >
            <Eye size={16} />
            <span>Détail complet</span>
          </button>

          {/* Imprimer le ticket */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onPrintTicket()
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 text-left transition-colors"
            role="menuitem"
          >
            <Printer size={16} />
            <span>Imprimer ticket cuisine</span>
          </button>

          {/* Appeler le client */}
          {order.phone && (
            <a
              href={`tel:${order.phone}`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 text-left transition-colors"
              role="menuitem"
            >
              <Phone size={16} />
              <span>Appeler le client</span>
            </a>
          )}

          <div className="my-1 border-t" style={{ borderColor: 'var(--kds-border-default)' }} />

          {/* Annuler la commande */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (window.confirm(`Confirmer l'annulation de la commande ${order.orderRef} ?`)) {
                onCancelOrder()
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 text-left transition-colors"
            role="menuitem"
          >
            <XCircle size={16} />
            <span>Annuler la commande</span>
          </button>
        </div>
      )}
    </div>
  )
}
