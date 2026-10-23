import React from 'react'
import {
  Search,
  RefreshCw,
  TrendingUp,
  Clock,
  Layers,
  X,
  History,
  ChefHat,
} from 'lucide-react'
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
  onRefresh: () => void
  isRefreshing: boolean
  lastSyncTime: Date | null
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export const KpiBar: React.FC<KpiBarProps> = ({
  viewMode,
  onViewModeChange,
  activeCount,
  historyCount,
  kpis,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  lastSyncTime,
  searchInputRef,
}) => {
  return (
    <div
      className="w-full h-[64px] min-h-[64px] max-h-[64px] px-6 border-b flex items-center justify-between gap-3 select-none flex-nowrap overflow-x-hidden"
      style={{
        backgroundColor: '#0B0D10',
        borderColor: '#232830',
      }}
      role="region"
      aria-label="Bandeau de pilotage et KPI"
    >
      {/* 1. GAUCHE : ONGLETS VUE (EN COURS / HISTORIQUE) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange('kanban')}
          className="h-[38px] flex items-center gap-2 px-3.5 rounded-xl text-xs font-bold transition-all border shrink-0"
          style={{
            backgroundColor: viewMode === 'kanban' ? '#14171C' : 'transparent',
            borderColor: viewMode === 'kanban' ? '#F5B301' : '#232830',
            color: viewMode === 'kanban' ? '#F2F4F7' : '#9AA3AF',
          }}
        >
          <ChefHat size={15} style={{ color: viewMode === 'kanban' ? '#F5B301' : '#9AA3AF' }} />
          <span>En cours</span>
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-black font-tabular ml-0.5"
            style={{
              backgroundColor: activeCount > 0 ? '#F5B301' : '#232830',
              color: activeCount > 0 ? '#0B0D10' : '#9AA3AF',
            }}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('history')}
          className="h-[38px] flex items-center gap-2 px-3.5 rounded-xl text-xs font-bold transition-all border shrink-0"
          style={{
            backgroundColor: viewMode === 'history' ? '#14171C' : 'transparent',
            borderColor: viewMode === 'history' ? '#F5B301' : '#232830',
            color: viewMode === 'history' ? '#F2F4F7' : '#9AA3AF',
          }}
        >
          <History size={15} />
          <span>Historique</span>
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-black font-tabular ml-0.5"
            style={{
              backgroundColor: '#232830',
              color: '#9AA3AF',
            }}
          >
            {historyCount}
          </span>
        </button>
      </div>

      {/* 2. CENTRE : RECHERCHE RAPIDE COMPACTE */}
      <div className="flex-1 max-w-xs mx-2 flex items-center justify-center">
        <div className="relative w-full max-w-[280px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#9AA3AF' }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher (#réf, client, tél)…"
            className="w-full h-[38px] pl-9 pr-8 rounded-xl text-xs font-medium focus:outline-none transition-all border"
            style={{
              backgroundColor: '#14171C',
              borderColor: searchQuery ? '#F5B301' : '#232830',
              color: '#F2F4F7',
            }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
              title="Effacer"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold rounded border pointer-events-none"
              style={{
                backgroundColor: '#0B0D10',
                borderColor: '#232830',
                color: '#6C7684',
              }}
            >
              /
            </kbd>
          )}
        </div>
      </div>

      {/* 3. DROITE : 3 KPI COMPACTS MONOCHROMES + BOUTON RAFRAÎCHIR */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Encart KPI compact monochrome sans pastille de couleur */}
        <div
          className="h-[38px] px-3.5 rounded-xl border flex items-center gap-3.5 text-xs shrink-0"
          style={{
            backgroundColor: '#14171C',
            borderColor: '#232830',
          }}
        >
          {/* Total Encaissé */}
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="shrink-0 text-slate-400" />
            <span style={{ color: '#9AA3AF' }}>Total :</span>
            <span className="font-bold font-tabular" style={{ color: '#F2F4F7' }}>
              {formatFcfa(kpis.todayRevenue)}
            </span>
          </div>

          <div className="h-4 w-px" style={{ backgroundColor: '#232830' }} />

          {/* Commandes du jour */}
          <div className="flex items-center gap-1.5">
            <Layers size={14} className="shrink-0 text-slate-400" />
            <span style={{ color: '#9AA3AF' }}>Cmdes :</span>
            <span className="font-bold font-tabular" style={{ color: '#F2F4F7' }}>
              {kpis.totalOrders}
            </span>
          </div>

          <div className="h-4 w-px" style={{ backgroundColor: '#232830' }} />

          {/* Temps moyen prep. */}
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="shrink-0 text-slate-400" />
            <span style={{ color: '#9AA3AF' }}>Moy. :</span>
            <span className="font-bold font-tabular" style={{ color: '#F2F4F7' }}>
              {kpis.avgPrepTimeMinutes}&nbsp;min
            </span>
          </div>
        </div>

        {/* Bouton Rafraîchir compact */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-[38px] flex items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 shrink-0 hover:border-slate-500"
          style={{
            backgroundColor: '#14171C',
            borderColor: '#232830',
            color: '#F2F4F7',
          }}
          title={lastSyncTime ? `Dernière mise à jour à ${lastSyncTime.toLocaleTimeString('fr-FR')}` : 'Rafraîchir'}
        >
          <RefreshCw
            size={14}
            className={isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-400'}
          />
          <span className="hidden sm:inline">Rafraîchir</span>
        </button>
      </div>
    </div>
  )
}
