import { useEffect } from 'react'

interface ShortcutHandlers {
  onSearchFocus?: () => void
  onEscape?: () => void
  onRefresh?: () => void
  onToggleSound?: () => void
  onSelectColumn?: (colIndex: number) => void
}

/**
 * Hook de raccourcis clavier pour poste KDS tactile/hybride
 * - `/` : focalise instantanément la barre de recherche
 * - `Escape` : ferme le panneau latéral, désélectionne ou annule
 * - `r` ou `R` : rafraîchit manuellement les commandes
 * - `m` ou `M` : coupe / réactive le son
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si l'utilisateur est déjà en train de taper dans un champ de texte
      const target = event.target as HTMLElement | null
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable

      if (event.key === 'Escape') {
        handlers.onEscape?.()
        return
      }

      if (isInput) return

      if (event.key === '/') {
        event.preventDefault()
        handlers.onSearchFocus?.()
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        handlers.onRefresh?.()
      } else if (event.key === 'm' || event.key === 'M') {
        event.preventDefault()
        handlers.onToggleSound?.()
      } else if (['1', '2', '3', '4'].includes(event.key)) {
        const col = parseInt(event.key, 10) - 1
        handlers.onSelectColumn?.(col)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
