import React, { useState } from 'react'
import type { AdminTab } from './AppHeader'

interface AdminSidebarProps {
  currentTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  onLogout?: () => void
  currentUser?: string | null
}

const NAV_ITEMS: { id: AdminTab; label: string }[] = [
  { id: 'kds', label: 'Commandes' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'special', label: 'Plat du jour' },
  { id: 'staff', label: 'Employés' },
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
      className="w-56 min-w-[224px] h-full flex flex-col justify-between border-r border-[#1F242B] bg-[#0F1216] select-none"
      aria-label="Navigation"
    >
      <div>
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-[#1F242B]">
          <img src="/images/brand/logo.png" alt="BMC Food" className="h-7 w-auto object-contain" />
          <span className="text-sm font-bold text-white">BMC Food</span>
        </div>

        <nav className="p-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1E24] text-white font-semibold border-l-2 border-[#F5B301]'
                    : 'text-[#8A93A0] hover:text-white hover:bg-[#15191E]'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-[#1F242B]">
        {isConfirmingLogout ? (
          <div className="space-y-2">
            <p className="text-xs text-[#C4CAD3] px-1">Se déconnecter ?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingLogout(false)}
                className="flex-1 py-2 rounded-lg bg-[#1A1E24] text-xs text-[#C4CAD3] hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => onLogout?.()}
                className="flex-1 py-2 rounded-lg bg-[#B42318] text-xs font-semibold text-white hover:bg-[#C8321F] cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-[#8A93A0] truncate">{currentUser || 'Admin'}</span>
            <button
              type="button"
              onClick={() => setIsConfirmingLogout(true)}
              className="text-xs text-[#8A93A0] hover:text-white cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
