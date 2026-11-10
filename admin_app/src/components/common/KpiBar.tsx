import React from 'react'
import { formatFcfa } from '../../lib/formatters'
import type { KdsKpis } from '../../types/kds'

interface KpiBarProps {
  viewMode: 'kanban' | 'history'
  onViewModeChange: (mode: 'kanban' | 'history') => void
  activeCount: number
  historyCount: number
  kpis: KdsKpis
  searchQuery: string
  onSearchChange: (query: string) => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export const KpiBar: React.FC<KpiBarProps> = ({
  kpis,
  searchQuery,
  onSearchChange,
  searchInputRef,
}) => {

  return (
    <div className="h-11 min-h-11 px-6 border-b border-[#1F242B] flex items-center justify-between gap-4 bg-[#0B0D10]/50">
      <div className="flex-1 max-w-sm">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par référence, client..."
          className="w-full h-8 px-3 rounded-lg bg-[#121519] border border-[#1F242B] text-xs text-white placeholder-[#5F6875] focus:outline-none focus:border-[#F5B301]/50"
        />
      </div>

      <div className="flex items-center gap-6 text-sm">
        <span className="text-[#8A93A0]">
          Aujourd'hui <span className="text-white font-semibold ml-1">{formatFcfa(kpis.todayRevenue)}</span>
        </span>
        <span className="text-[#8A93A0]">
          Commandes <span className="text-white font-semibold ml-1">{kpis.totalOrders}</span>
        </span>
      </div>
    </div>
  )
}
