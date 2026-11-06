import React from 'react'

export type AdminTab = 'kds' | 'special' | 'promotions' | 'transactions' | 'staff'

interface AppHeaderProps {
  currentTab: AdminTab
}

const TITLES: Record<AdminTab, string> = {
  kds: 'Commandes',
  promotions: 'Promotions',
  transactions: 'Transactions',
  special: 'Plat du jour',
  staff: 'Employés & Accès',
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentTab }) => {
  return (
    <header className="h-12 min-h-12 flex items-center px-6 border-b border-[#1F242B] bg-[#0B0D10]">
      <h1 className="text-base font-bold text-white tracking-tight">{TITLES[currentTab]}</h1>
    </header>
  )
}
