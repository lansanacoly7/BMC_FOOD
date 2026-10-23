import React from 'react'
import { Utensils } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Aucune commande',
  message = 'Les nouvelles commandes apparaissent ici automatiquement.',
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all"
        style={{
          backgroundColor: 'var(--kds-bg-surface-raised)',
          border: '1px solid var(--kds-border-default)',
          color: 'var(--kds-text-faint)',
        }}
      >
        {icon || <Utensils size={28} strokeWidth={1.5} />}
      </div>
      <h3
        className="text-base font-bold mb-1.5"
        style={{ color: 'var(--kds-text-secondary)' }}
      >
        {title}
      </h3>
      <p
        className="text-xs max-w-[240px] leading-relaxed"
        style={{ color: 'var(--kds-text-muted)' }}
      >
        {message}
      </p>
    </div>
  )
}
