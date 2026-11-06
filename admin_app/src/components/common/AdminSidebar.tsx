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
  { id: 'staff', label: 'Personnel' },
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
      className="w-44 min-w-[176px] h-full flex flex-col justify-between border-r border-[#262A33] bg-[#0F1115] select-none text-[#E6E8EC] font-sans"
      aria-label="Navigation latérale"
    >
      <div>
        <div className="h-10 px-3.5 flex items-center gap-2 border-b border-[#262A33]">
          <img src="/images/brand/logo.png" alt="BMC Food" className="h-5 w-auto object-contain" />
          <span className="text-xs font-bold tracking-tight text-[#E6E8EC]">BMC Food</span>
        </div>

        <nav className="p-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer rounded-r ${
                  isActive
                    ? 'bg-[#171A21] text-[#E6E8EC] font-semibold border-l-2 border-[#E8A33D]'
                    : 'text-[#8B93A1] hover:text-[#E6E8EC] hover:bg-[#171A21]/50'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-2.5 border-t border-[#262A33]">
        {isConfirmingLogout ? (
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#8B93A1] px-1">Déconnexion ?</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsConfirmingLogout(false)}
                className="flex-1 py-1 rounded bg-[#171A21] text-[11px] text-[#8B93A1] hover:text-[#E6E8EC] cursor-pointer"
              >
                Non
              </button>
              <button
                type="button"
                onClick={() => onLogout?.()}
                className="flex-1 py-1 rounded bg-[#E04848] text-[11px] font-semibold text-white hover:bg-[#C8321F] cursor-pointer"
              >
                Oui
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-[#8B93A1] truncate max-w-[90px]">{currentUser || 'Admin'}</span>
            <button
              type="button"
              onClick={() => setIsConfirmingLogout(true)}
              className="text-[11px] text-[#8B93A1] hover:text-[#E6E8EC] cursor-pointer"
            >
              Quitter
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
