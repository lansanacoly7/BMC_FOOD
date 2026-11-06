import React, { useState, useEffect } from 'react'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Search,
  Bike,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import type { OrderType } from '../../types/kds'

export type AdminTab = 'kds' | 'special' | 'promotions' | 'transactions' | 'staff'

interface AppHeaderProps {
  currentTab: AdminTab
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  typeFilter?: 'all' | OrderType
  onTypeFilterChange?: (type: 'all' | OrderType) => void
}

const TITLES: Record<AdminTab, string> = {
  kds: 'Commandes',
  promotions: 'Promotions',
  transactions: 'Caisse & Transactions',
  special: 'Plat du jour',
  staff: 'Personnel & Accès',
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  isSidebarCollapsed = false,
  onToggleSidebar,
  searchQuery = '',
  onSearchChange,
  typeFilter = 'all',
  onTypeFilterChange,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <header className="h-10 min-h-10 flex items-center justify-between px-3 border-b border-[#262A33] bg-[#171A21] text-[#E6E8EC] font-sans select-none shrink-0 gap-3">
      {/* 1. GAUCHE : Bascule Sidebar + Titre "Commandes" */}
      <div className="flex items-center gap-2 shrink-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1 rounded text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33] transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Afficher la barre latérale' : 'Masquer la barre latérale'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="size-4 text-[#E8A33D]" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        )}
        <h1 className="text-xs font-bold text-[#E6E8EC] tracking-tight uppercase">
          {TITLES[currentTab]}
        </h1>
      </div>

      {/* 2. CENTRE-GAUCHE : Recherche (#ticket, client, plat) */}
      {currentTab === 'kds' && onSearchChange !== undefined && (
        <div className="flex-1 max-w-xs min-w-[160px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#8B93A1]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher #ticket, client, plat..."
              className="w-full h-7 pl-7 pr-2.5 rounded bg-[#0F1115] border border-[#262A33] text-xs text-[#E6E8EC] placeholder-[#8B93A1] focus:outline-none focus:border-[#E8A33D] transition-colors"
            />
          </div>
        </div>
      )}

      {/* 3. CENTRE-DROIT : Filtre segmenté Tous · Livraison · À emporter · Sur place */}
      {currentTab === 'kds' && onTypeFilterChange !== undefined && (
        <div className="flex items-center gap-0.5 bg-[#0F1115] p-0.5 rounded border border-[#262A33] shrink-0 text-xs">
          <button
            type="button"
            onClick={() => onTypeFilterChange('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-[#262A33] text-[#E6E8EC] font-semibold'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('delivery')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              typeFilter === 'delivery'
                ? 'bg-[#262A33] text-[#E6E8EC] font-semibold'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
          >
            <Bike className="size-3 text-[#8B93A1]" />
            <span>Livraison</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('takeaway')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              typeFilter === 'takeaway'
                ? 'bg-[#262A33] text-[#E6E8EC] font-semibold'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
          >
            <ShoppingBag className="size-3 text-[#8B93A1]" />
            <span>À emporter</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('dine_in')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              typeFilter === 'dine_in'
                ? 'bg-[#262A33] text-[#E6E8EC] font-semibold'
                : 'text-[#8B93A1] hover:text-[#E6E8EC]'
            }`}
          >
            <Utensils className="size-3 text-[#8B93A1]" />
            <span>Sur place</span>
          </button>
        </div>
      )}

      {/* 4. DROITE : Bouton Plein écran */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          title={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
        >
          {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Réduire' : 'Plein écran'}</span>
        </button>
      </div>
    </header>
  )
}
