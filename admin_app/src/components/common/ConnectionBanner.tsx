import React from 'react'
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react'
import type { ApiConnectionState } from '../../hooks/useOrders'

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

  return (
    <div
      className="w-full px-6 py-2.5 flex items-center justify-between text-sm font-bold shadow-md z-30 transition-all border-b"
      style={{
        backgroundColor: isOffline ? '#334155' : 'var(--kds-urgency-danger)',
        borderColor: isOffline ? '#475569' : '#DC2626',
        color: '#FFFFFF',
      }}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {isOffline ? <WifiOff size={20} strokeWidth={2.5} /> : <AlertCircle size={20} strokeWidth={2.5} />}
        <span>
          {isOffline
            ? 'Connexion réseau interrompue. Les commandes locales sont conservées.'
            : 'Impossible de joindre le serveur Django. Vérifiez le backend ou relancez la tentative.'}
        </span>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 text-white transition-all disabled:opacity-50"
      >
        <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
        <span>Réessayer</span>
      </button>
    </div>
  )
}
