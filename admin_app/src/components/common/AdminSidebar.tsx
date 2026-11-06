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
      className="w-44 min-w-[176px] h-full flex flex-col justify-between border-r border-[#262D38] bg-[#0E1116] select-none text-[#FFFFFF] font-sans shrink-0 z-30"
      aria-label="Navigation latérale"
    >
      <div>
        <div className="h-12 px-3.5 flex items-center gap-2 border-b border-[#262D38]">
          <img src="/images/brand/logo.png" alt="BMC Food" className="h-5 w-auto object-contain" />
          <span className="text-xs font-black tracking-wider uppercase text-[#FFFFFF]">BMC Food</span>
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
                    ? 'bg-[#1A1F27] text-[#FFFFFF] font-bold border-l-2 border-[#F5B800]'
                    : 'text-[#9AA4B2] hover:text-[#FFFFFF] hover:bg-[#1A1F27]/60 font-medium'
                }`}
              >
                <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-[#F5B800]' : 'text-[#687385]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-2.5 border-t border-[#262D38] bg-[#0E1116]">
        {isConfirmingLogout ? (
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#9AA4B2] px-1 font-semibold">Déconnexion ?</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsConfirmingLogout(false)}
                className="flex-1 py-1 rounded bg-[#1A1F27] text-[11px] text-[#9AA4B2] hover:text-[#FFFFFF] cursor-pointer"
              >
                Non
              </button>
              <button
                type="button"
                onClick={() => onLogout?.()}
                className="flex-1 py-1 rounded bg-[#E5362B] text-[11px] font-bold text-white hover:bg-[#C8321F] cursor-pointer"
              >
                Oui
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-[#9AA4B2] truncate max-w-[90px]">
              {currentUser || 'Admin'}
            </span>
            <button
              type="button"
              onClick={() => setIsConfirmingLogout(true)}
              className="text-[11px] text-[#9AA4B2] hover:text-[#E5362B] cursor-pointer flex items-center gap-1 font-semibold transition-colors"
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
