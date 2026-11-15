import React, { useState } from 'react'
import { LogOut, Receipt, Sparkles, Tag, UtensilsCrossed, Users, type LucideIcon } from 'lucide-react'
import type { AdminTab } from './AppHeader'

interface AdminSidebarProps {
  currentTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  onLogout?: () => void
  currentUser?: string | null
  isCollapsed?: boolean
  /** Commandes en cours, affichées à côté de « Cuisine ». */
  liveCount?: number
}

const NAV_GROUPS: { title: string; items: { id: AdminTab; label: string; icon: LucideIcon }[] }[] = [
  {
    title: 'Service',
    items: [
      { id: 'kds', label: 'Cuisine', icon: UtensilsCrossed },
      { id: 'transactions', label: 'Transactions', icon: Receipt },
    ],
  },
  {
    title: 'Carte',
    items: [
      { id: 'special', label: 'Plat du jour', icon: Sparkles },
      { id: 'promotions', label: 'Promotions', icon: Tag },
    ],
  },
  {
    title: 'Équipe',
    items: [{ id: 'staff', label: 'Personnel', icon: Users }],
  },
]

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onTabChange,
  onLogout,
  currentUser,
  isCollapsed = false,
  liveCount = 0,
}) => {
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false)
  const userName = currentUser || 'Admin'

  return (
    <aside
      aria-label="Navigation latérale"
      className={`theme-dark z-30 flex h-full shrink-0 select-none flex-col border-r border-line bg-canvas text-ink transition-[width] duration-200 ${
        isCollapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      <div className={`flex h-20 shrink-0 items-center ${isCollapsed ? 'justify-center' : 'px-5'}`}>
        <img
          src={isCollapsed ? '/images/brand/logo_toque.png' : '/images/brand/logo.png'}
          alt="BMC Food"
          className={isCollapsed ? 'size-9 scale-150 object-contain' : 'h-16 w-auto scale-125 object-contain'}
        />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3 pt-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <p className="mb-1 px-3 text-xs font-medium text-ink-faint">{group.title}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = currentTab === item.id
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onTabChange(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={item.label}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg text-sm transition-colors ${
                        isCollapsed ? 'justify-center' : 'px-3'
                      } ${
                        isActive
                          ? 'bg-surface font-semibold text-ink'
                          : 'font-medium text-ink-soft hover:bg-surface/60 hover:text-ink'
                      }`}
                    >
                      <Icon className={`size-[18px] shrink-0 ${isActive ? 'text-bmc-gold' : ''}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                      {!isCollapsed && item.id === 'kds' && liveCount > 0 && (
                        <span className="ml-auto rounded-md bg-raised px-1.5 text-xs font-semibold tabular-nums text-ink">
                          {liveCount}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        {isConfirmingLogout && !isCollapsed ? (
          <div className="space-y-2 px-1 py-0.5">
            <p className="text-[13px] text-ink-soft">Fermer la session ?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingLogout(false)}
                className="h-8 flex-1 cursor-pointer rounded-md bg-surface text-[13px] font-medium text-ink hover:bg-raised"
              >
                Rester
              </button>
              <button
                type="button"
                onClick={() => onLogout?.()}
                className="h-8 flex-1 cursor-pointer rounded-md bg-bmc-orange-braise text-[13px] font-semibold text-white hover:bg-[#B53F06]"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'px-1'}`}>
            {!isCollapsed && (
              <>
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-raised font-display text-sm font-bold uppercase text-bmc-gold"
                >
                  {userName.charAt(0)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{userName}</span>
              </>
            )}
            <button
              type="button"
              onClick={() => (isCollapsed ? onLogout?.() : setIsConfirmingLogout(true))}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
