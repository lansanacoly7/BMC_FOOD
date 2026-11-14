import { useSyncExternalStore } from 'react'

/** Grand écran : même seuil que le point de rupture « lg » de Tailwind (1024 px). */
const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * Vrai sur ordinateur (1024 px et plus), mis à jour si la fenêtre change de taille.
 * Sert à choisir entre la page « La carte » (ordinateur) et la carte intégrée à l'accueil (téléphone, tablette).
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  )
}
