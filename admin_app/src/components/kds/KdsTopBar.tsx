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
  Volume2,
  VolumeX,
  History,
  SlidersHorizontal,
  Circle,
} from 'lucide-react'
import type { OrderType } from '../../types/kds'

interface KdsTopBarProps {
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  typeFilter: 'all' | OrderType
  onTypeFilterChange: (type: 'all' | OrderType) => void
  countsByType: {
    all: number
    delivery: number
    takeaway: number
    dine_in: number
  }
  historyCount: number
  onOpenHistory: () => void
  isAudioMuted: boolean
  onToggleAudio: () => void
}

export const KdsTopBar: React.FC<KdsTopBarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  countsByType,
  historyCount,
  onOpenHistory,
  isAudioMuted,
  onToggleAudio,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)

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
    <header className="h-12 min-h-12 px-3 border-b border-[#262D38] bg-[#1A1F27] text-[#FFFFFF] flex items-center justify-between gap-2.5 font-sans select-none shrink-0">
      {/* 1. GAUCHE : Sidebar toggle + Titre Cuisine + Pastille En direct */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-[#262D38] text-[#9AA4B2] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          title={isSidebarCollapsed ? 'Afficher la barre latérale' : 'Masquer la barre latérale'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="size-4 text-[#F5B800]" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>

        <h1 className="text-sm font-black tracking-wider uppercase text-[#FFFFFF] flex items-center gap-2">
          <span>Cuisine</span>
        </h1>

        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1FA855]/20 text-[#1FA855] border border-[#1FA855]/40 shrink-0">
          <Circle className="size-2 fill-[#1FA855] animate-pulse" />
          <span>En direct</span>
        </span>
      </div>

      {/* 2. RECHERCHE RAPIDE (#ticket, client, plat) */}
      <div className="flex-1 max-w-xs min-w-[140px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#9AA4B2]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher #ticket, client, plat..."
            className="w-full h-8 pl-8 pr-2.5 rounded bg-[#0E1116] border border-[#262D38] text-xs text-[#FFFFFF] placeholder-[#687385] focus:outline-none focus:border-[#F5B800] transition-colors"
          />
        </div>
      </div>

      {/* 3. FILTRE SEGMENTÉ AVEC COMPTEURS PAR TYPE */}
      <div className="flex items-center gap-1 bg-[#0E1116] p-1 rounded-md border border-[#262D38] shrink-0 text-xs">
        <button
          type="button"
          onClick={() => onTypeFilterChange('all')}
          className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'all'
              ? 'bg-[#262D38] text-[#FFFFFF]'
              : 'text-[#9AA4B2] hover:text-[#FFFFFF]'
          }`}
        >
          <span>Tous</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1A1F27] text-[#FFFFFF] font-mono">
            {countsByType.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeFilterChange('delivery')}
          className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            typeFilter === 'delivery'
              ? 'bg-[#8B5CF6]/30 text-[#8B5CF6] border border-[#8B5CF6]/50'
              : 'text-[#9AA4B2] hover:text-[#FFFFFF]'
          }`}
          title="Commandes en livraison"
        >
          <Bike className="size-3 text-[#8B5CF6]" />
          <span className="hidden xl:inline">Livraison</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1A1F27] text-[#FFFFFF] font-mono">
            {countsByType.delivery}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeFilterChange('takeaway')}
          className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            typeFilter === 'takeaway'
              ? 'bg-[#FB923C]/30 text-[#FB923C] border border-[#FB923C]/50'
              : 'text-[#9AA4B2] hover:text-[#FFFFFF]'
          }`}
          title="Commandes à emporter"
        >
          <ShoppingBag className="size-3 text-[#FB923C]" />
          <span className="hidden xl:inline">À emporter</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1A1F27] text-[#FFFFFF] font-mono">
            {countsByType.takeaway}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTypeFilterChange('dine_in')}
          className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
            typeFilter === 'dine_in'
              ? 'bg-[#14B8A6]/30 text-[#14B8A6] border border-[#14B8A6]/50'
              : 'text-[#9AA4B2] hover:text-[#FFFFFF]'
          }`}
          title="Commandes sur place"
        >
          <Utensils className="size-3 text-[#14B8A6]" />
          <span className="hidden xl:inline">Sur place</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1A1F27] text-[#FFFFFF] font-mono">
            {countsByType.dine_in}
          </span>
        </button>
      </div>

      {/* 4. ACTIONS : Historique, Filtres supplémentaires, Son, Plein écran */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenHistory}
          className="h-8 px-2.5 rounded bg-[#0E1116] hover:bg-[#262D38] border border-[#262D38] text-xs font-semibold text-[#9AA4B2] hover:text-[#FFFFFF] transition-colors cursor-pointer flex items-center gap-1.5"
          title="Consulter les commandes livrées et annulées"
        >
          <History className="size-3.5 text-[#F5B800]" />
          <span className="hidden xl:inline">Historique</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#262D38] text-[#FFFFFF] font-mono">
            {historyCount}
          </span>
        </button>

        {/* Bouton Filtres supplémentaires (employé, canal) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFiltersModal((prev) => !prev)}
            className="h-8 px-2 rounded bg-[#0E1116] hover:bg-[#262D38] border border-[#262D38] text-xs font-semibold text-[#9AA4B2] hover:text-[#FFFFFF] transition-colors cursor-pointer flex items-center gap-1"
            title="Filtres avancés"
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden xl:inline">Filtres</span>
          </button>

          {showFiltersModal && (
            <div
              className="absolute right-0 top-full mt-1.5 w-60 rounded-lg border border-[#262D38] bg-[#1A1F27] p-3 shadow-2xl z-40 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#262D38] font-bold text-[#FFFFFF]">
                <span>Filtres supplémentaires</span>
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="text-[#9AA4B2] hover:text-[#FFFFFF]"
                >
                  ✕
                </button>
              </div>
              <div className="py-2.5 space-y-2">
                <div>
                  <label className="text-[11px] text-[#9AA4B2] font-semibold block mb-1">Canal de vente</label>
                  <select className="w-full bg-[#0E1116] border border-[#262D38] rounded p-1.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#F5B800]">
                    <option value="all">Tous les canaux (Web & Caisse)</option>
                    <option value="web">Site Web Client</option>
                    <option value="pos">Comptoir Caisse</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#9AA4B2] font-semibold block mb-1">Poste de préparation</label>
                  <select className="w-full bg-[#0E1116] border border-[#262D38] rounded p-1.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#F5B800]">
                    <option value="all">Tous les postes (Grillades & Frites)</option>
                    <option value="grill">Gril / Braise</option>
                    <option value="sides">Accompagnements / Boissons</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Son optionnel */}
        <button
          type="button"
          onClick={onToggleAudio}
          className="h-8 px-2 rounded bg-[#0E1116] hover:bg-[#262D38] border border-[#262D38] text-xs font-semibold text-[#9AA4B2] hover:text-[#FFFFFF] transition-colors cursor-pointer flex items-center gap-1"
          title={isAudioMuted ? 'Activer le carillon sonore' : 'Couper le son'}
        >
          {isAudioMuted ? (
            <VolumeX className="size-3.5 text-[#687385]" />
          ) : (
            <Volume2 className="size-3.5 text-[#F5B800]" />
          )}
          <span className="hidden xl:inline">{isAudioMuted ? 'Muet' : 'Son'}</span>
        </button>

        {/* Plein écran */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="h-8 px-2 rounded bg-[#0E1116] hover:bg-[#262D38] border border-[#262D38] text-xs font-semibold text-[#9AA4B2] hover:text-[#FFFFFF] transition-colors cursor-pointer flex items-center gap-1"
          title={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}
        >
          {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          <span className="hidden xl:inline">{isFullscreen ? 'Réduire' : 'Plein écran'}</span>
        </button>
      </div>
    </header>
  )
}
