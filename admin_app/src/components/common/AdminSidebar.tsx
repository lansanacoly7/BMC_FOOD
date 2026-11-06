import React, { useState } from 'react'
import {
  UtensilsCrossed,
  Tag,
  Receipt,
  Sparkles,
  Users,
  LogOut,
} from 'lucide-react'
import type { AdminTab } from './AppHeader'

interface AdminSidebarProps {
  currentTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  onLogout?: () => void
  currentUser?: string | null
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'kds', label: 'Cuisine', icon: UtensilsCrossed },
  { id: 'promotions', label: 'Promotions', icon: Tag },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'special', label: 'Plat du jour', icon: Sparkles },
  { id: 'staff', label: 'Personnel', icon: Users },
]

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onTabChange,
  onLogout,
  currentUser,
}) => {
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false)

  return (
    <aside
      className="w-44 min-w-[176px] h-full flex flex-col justify-between border-r border-[#262A33] bg-[#0F1115] select-none text-[#F2F4F7] font-sans shrink-0 z-30"
      aria-label="Navigation latérale"
    >
      <div>
        <div className="h-12 px-3.5 flex items-center gap-2 border-b border-[#262A33]">
          <img src="/images/brand/logo.png" alt="BMC Food" className="h-5 w-auto object-contain" />
          <span className="text-xs font-bold tracking-wider uppercase text-[#F2F4F7]">BMC Food</span>
        </div>

        <nav className="p-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer rounded flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-[#181B22] text-[#F2F4F7] font-bold border-l-2 border-[#F59E0B]'
                    : 'text-[#8A93A3] hover:text-[#F2F4F7] hover:bg-[#181B22]/60 font-medium'
                }`}
              >
                <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-[#F59E0B]' : 'text-[#8A93A3]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-2.5 border-t border-[#262A33] bg-[#0F1115]">
        {isConfirmingLogout ? (
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#8A93A3] px-1 font-semibold">Déconnexion ?</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsConfirmingLogout(false)}
                className="flex-1 py-1 rounded bg-[#181B22] text-[11px] text-[#8A93A3] hover:text-[#F2F4F7] cursor-pointer"
              >
                Non
              </button>
              <button
                type="button"
                onClick={() => onLogout?.()}
                className="flex-1 py-1 rounded bg-[#EF4444] text-[11px] font-bold text-white hover:bg-[#DC2626] cursor-pointer"
              >
                Oui
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-[#8A93A3] truncate max-w-[90px]">
              {currentUser || 'Admin'}
            </span>
            <button
              type="button"
              onClick={() => setIsConfirmingLogout(true)}
              className="text-[11px] text-[#8A93A3] hover:text-[#EF4444] cursor-pointer flex items-center gap-1 font-semibold transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="size-3" />
              <span>Quitter</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
