import React, { useMemo, useState } from 'react'
import {
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react'

import { exportOrdersToCsv, formatDateTime, formatFcfa } from '../../lib/formatters'
import type { KdsOrder, KdsOrderStatus } from '../../types/kds'
import { OrderTypePill, PaymentPill } from '../common/StatusPills'

interface HistoryTableProps {
  orders: KdsOrder[]
  onSelectOrder: (order: KdsOrder) => void
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ orders, onSelectOrder }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [query, setQuery] = useState<string>('')

  // Filtrage des commandes de l'historique
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Filtre statut
      if (statusFilter !== 'all' && o.status !== statusFilter) return false

      // Filtre paiement
      if (paymentFilter !== 'all' && o.paymentMethod !== paymentFilter) return false

      // Recherche textuelle
      if (query.trim()) {
        const q = query.toLowerCase()
        const matchRef = o.orderRef.toLowerCase().includes(q)
        const matchName = o.customerName.toLowerCase().includes(q)
        const matchPhone = o.phone.toLowerCase().includes(q)
        const matchItems = o.items.some((i) => i.name.toLowerCase().includes(q))
        if (!matchRef && !matchName && !matchPhone && !matchItems) return false
      }

      return true
    })
  }, [orders, statusFilter, paymentFilter, query])

  const handleExport = () => {
    exportOrdersToCsv(filteredOrders)
  }

  const getStatusBadge = (status: KdsOrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} />
            Livrée / Terminée
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle size={13} />
            Annulée
          </span>
        )
      case 'delivering':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            En livraison
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* BARRE DE FILTRES & BOUTON D'EXPORTATION */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--kds-bg-surface)',
          borderColor: 'var(--kds-border-default)',
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer l'historique…"
              className="pl-9 pr-3 py-2 rounded-xl text-sm font-medium w-56 border focus:outline-none"
              style={{
                backgroundColor: 'var(--kds-bg-app)',
                borderColor: 'var(--kds-border-default)',
                color: 'var(--kds-text-primary)',
              }}
            />
          </div>

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-bold border focus:outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--kds-bg-app)',
              borderColor: 'var(--kds-border-default)',
              color: 'var(--kds-text-secondary)',
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="delivered">Livrées uniquement</option>
            <option value="cancelled">Annulées uniquement</option>
            <option value="delivering">En livraison</option>
          </select>

          {/* Filtre Paiement */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-bold border focus:outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--kds-bg-app)',
              borderColor: 'var(--kds-border-default)',
              color: 'var(--kds-text-secondary)',
            }}
          >
            <option value="all">Tous les paiements</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="cash">Espèces</option>
          </select>
        </div>

        {/* Bouton Export CSV */}
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all text-slate-200 hover:text-white"
          style={{
            backgroundColor: 'var(--kds-bg-surface-raised)',
            borderColor: 'var(--kds-border-default)',
          }}
        >
          <Download size={16} strokeWidth={2.5} />
          <span>Exporter CSV ({filteredOrders.length})</span>
        </button>
      </div>

      {/* TABLEAU RESPONSIVE */}
      <div
        className="rounded-2xl border overflow-hidden shadow-lg"
        style={{
          backgroundColor: 'var(--kds-bg-surface)',
          borderColor: 'var(--kds-border-default)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" role="table">
            <thead>
              <tr
                className="border-b text-xs font-black uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--kds-bg-surface-raised)',
                  borderColor: 'var(--kds-border-default)',
                  color: 'var(--kds-text-muted)',
                }}
              >
                <th className="py-3.5 px-4">Référence</th>
                <th className="py-3.5 px-4">Date / Heure</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Articles</th>
                <th className="py-3.5 px-4">Paiement</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--kds-border-subtle)' }}>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Aucune commande trouvée pour ces filtres.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-black font-tabular" style={{ color: 'var(--kds-text-primary)' }}>
                      {order.orderRef}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-300">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-bold" style={{ color: 'var(--kds-text-primary)' }}>
                      {order.customerName}
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderTypePill type={order.orderType} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-300 max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <PaymentPill method={order.paymentMethod} status={order.paymentStatus} />
                    </td>
                    <td className="py-3.5 px-4 font-black font-tabular" style={{ color: 'var(--kds-text-primary)' }}>
                      {formatFcfa(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectOrder(order)
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        title="Voir le détail"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
