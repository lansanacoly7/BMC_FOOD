import React from 'react'
import type { KdsOrder } from '../types/kds'
import { HistoryTable } from '../components/history/HistoryTable'

interface HistoryPageProps {
  orders: KdsOrder[]
  onSelectOrder: (order: KdsOrder) => void
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ orders, onSelectOrder }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-black" style={{ color: 'var(--kds-text-primary)' }}>
            Historique des commandes du jour
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            Consultation, recherche multi-critères et export comptable CSV pour BMC FOOD Dakar.
          </p>
        </div>

        <HistoryTable orders={orders} onSelectOrder={onSelectOrder} />
      </div>
    </div>
  )
}
