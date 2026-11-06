import React, { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2 } from 'lucide-react'

export type AdminTab = 'kds' | 'special' | 'promotions' | 'transactions' | 'staff'

interface AppHeaderProps {
  currentTab: AdminTab
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

const TITLES: Record<AdminTab, string> = {
  kds: 'Cuisine · KDS Direct',
  promotions: 'Promotions',
  transactions: 'Transactions & Caisse',
  special: 'Plat du jour',
  staff: 'Employés & Accès',
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  isSidebarCollapsed = false,
  onToggleSidebar,
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
    <header className="h-11 min-h-11 flex items-center justify-between px-4 border-b border-[#1E2532] bg-[#0C1016] select-none shrink-0">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-[#8C9AA9] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Afficher le menu de navigation' : 'Masquer la barre latérale pour plein écran'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="size-4 text-[#F5B301]" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
        <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
          <span>{TITLES[currentTab]}</span>
          {currentTab === 'kds' && (
            <span className="hidden sm:inline-block px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#F5B301]/20 text-[#F5B301] border border-[#F5B301]/30 uppercase">
              Mode Service
            </span>
          )}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-[#8C9AA9] hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title="Basculer en plein écran tablette/écran mural"
        >
          {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          <span className="hidden md:inline">{isFullscreen ? 'Quitter plein écran' : 'Plein écran'}</span>
        </button>
      </div>
    </header>
  )
}
