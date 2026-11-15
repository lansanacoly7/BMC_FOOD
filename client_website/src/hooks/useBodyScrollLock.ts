import { useEffect } from 'react'

/**
 * Fige la page derrière une fenêtre ouverte (connexion, menu latéral) : on ne peut plus la faire défiler,
 * ni à la molette ni au doigt. Le verrou porte sur <html> et <body> (sur téléphone, <body> seul ne suffit pas)
 * et rétablit les valeurs d'origine à la fermeture, ce qui permet d'empiler plusieurs fenêtres.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const { documentElement: html, body } = document
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      html.style.overflow = previous.htmlOverflow
      body.style.overflow = previous.bodyOverflow
      body.style.overscrollBehavior = previous.bodyOverscroll
    }
  }, [locked])
}
