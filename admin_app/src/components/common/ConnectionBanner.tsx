import React from 'react'
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import type { ApiConnectionState } from '../../hooks/useOrders'
import { Button } from '../ui/primitives'

interface ConnectionBannerProps {
  connectionState: ApiConnectionState
  onRetry: () => void
  isRetrying: boolean
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  connectionState,
  onRetry,
  isRetrying,
}) => {
  if (connectionState === 'connected' || connectionState === 'syncing') {
    return null
  }

  const isOffline = connectionState === 'offline'
  const isDemo = connectionState === 'demo'
  const Icon = isOffline ? WifiOff : AlertCircle

  return (
    <div
      role="alert"
      className={`flex shrink-0 items-center justify-between gap-4 border-b border-line px-4 py-2 text-left text-sm font-medium sm:px-6 ${
        isDemo ? 'bg-warn-soft text-warn' : 'bg-bad-soft text-bad'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-4 shrink-0" />
        <span>
          {isDemo
            ? 'Serveur injoignable : ces commandes sont des exemples, rien n’est enregistré.'
            : isOffline
              ? 'Connexion réseau interrompue. Les commandes locales sont conservées.'
              : 'Serveur injoignable. Vérifiez le backend, puis réessayez.'}
        </span>
      </div>
      <Button size="sm" icon={RefreshCw} onClick={onRetry} isLoading={isRetrying}>
        Réessayer
      </Button>
    </div>
  )
}
