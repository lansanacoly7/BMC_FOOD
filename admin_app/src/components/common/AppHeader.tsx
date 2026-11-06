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
  kds: 'Commandes / Cuisine KDS',
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
    <header className="h-10 min-h-10 flex items-center justify-between px-3 border-b border-[#262A33] bg-[#171A21] text-[#E6E8EC] font-sans select-none shrink-0 gap-3">
      {/* GAUCHE : Bascule Sidebar + Titre de page */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1 rounded text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33] transition-colors cursor-pointer"
            title={
              isSidebarCollapsed
                ? 'Afficher la barre latérale'
                : 'Masquer la barre latérale (Plein écran tablette)'
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="size-4 text-[#E8A33D]" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-xs font-bold text-[#E6E8EC] tracking-tight uppercase">
            {TITLES[currentTab]}
          </h1>
          {currentTab === 'kds' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono text-[#8B93A1] bg-[#0F1115] border border-[#262A33]">
              <span>Direct</span>
            </span>
          )}
        </div>
      </div>

      {/* CENTRE : Champ de recherche discret (Mode KDS) */}
      {currentTab === 'kds' && onSearchChange !== undefined && (
        <div className="flex-1 max-w-xs hidden sm:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#8B93A1]" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher réf, client, plat..."
              className="w-full h-7 pl-7 pr-2.5 rounded bg-[#0F1115] border border-[#262A33] text-xs text-[#E6E8EC] placeholder-[#8B93A1] focus:outline-none focus:border-[#E8A33D] transition-colors"
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
            className={`p-1 rounded transition-colors cursor-pointer ${
              isMuted
                ? 'text-[#E04848] hover:bg-[#E04848]/10'
                : 'text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33]'
            }`}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
          </button>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1 rounded text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#262A33] transition-colors cursor-pointer flex items-center gap-1 text-xs"
          title="Basculer en plein écran"
        >
          {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          <span className="hidden md:inline">{isFullscreen ? 'Réduire' : 'Plein écran'}</span>
        </button>
      </div>
    </header>
  )
}
