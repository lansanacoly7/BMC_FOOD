import React, { useState, useEffect } from 'react'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Search,
  Volume2,
  VolumeX,
} from 'lucide-react'

export type AdminTab = 'kds' | 'special' | 'promotions' | 'transactions' | 'staff'

interface AppHeaderProps {
  currentTab: AdminTab
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  isMuted?: boolean
  onToggleMute?: () => void
}

const TITLES: Record<AdminTab, string> = {
  kds: 'Cuisine KDS',
  promotions: 'Promotions',
  transactions: 'Caisse & Transactions',
  special: 'Plat du jour',
  staff: 'Personnel & Accès',
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  isSidebarCollapsed = false,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  isMuted = false,
  onToggleMute,
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
    <header className="h-11 min-h-11 flex items-center justify-between px-3 border-b border-[#1A212D] bg-[#0A0D12] select-none shrink-0 gap-3">
      {/* GAUCHE : Bascule Sidebar + Titre de page + Indicateur En direct */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-[#7E8B9F] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={
              isSidebarCollapsed
                ? 'Afficher la barre latérale'
                : 'Masquer la barre latérale (Plein écran tablette)'
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="size-4 text-[#F5B301]" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-black text-white tracking-tight">
            {TITLES[currentTab]}
          </h1>
          {currentTab === 'kds' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141A23] text-[#CBD5E1] border border-[#222B3A]">
              <span className="size-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span>Service en direct</span>
            </span>
          )}
        </div>
      </div>

      {/* CENTRE : Champ de recherche discret (En mode KDS) */}
      {currentTab === 'kds' && onSearchChange !== undefined && (
        <div className="flex-1 max-w-sm hidden sm:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#5A6779]" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher #ticket, client, plat..."
              className="w-full h-7.5 pl-8 pr-3 rounded-lg bg-[#12161E] border border-[#1E2634] text-xs text-white placeholder-[#5A6779] focus:outline-none focus:border-[#F5B301]/60 transition-colors"
            />
          </div>
        </div>
      )}

      {/* DROITE : Alertes audio + Plein écran */}
      <div className="flex items-center gap-1.5 shrink-0">
        {currentTab === 'kds' && onToggleMute && (
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isMuted
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-[#7E8B9F] hover:text-white hover:bg-white/10'
            }`}
            title={isMuted ? 'Activer le son des commandes' : 'Couper le son des commandes'}
          >
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-[#7E8B9F] hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title="Basculer en plein écran"
        >
          {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          <span className="hidden md:inline">{isFullscreen ? 'Réduire' : 'Plein écran'}</span>
        </button>
      </div>
    </header>
  )
}
