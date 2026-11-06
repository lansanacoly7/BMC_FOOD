import { stagger, useAnimate, useReducedMotion, type AnimationPlaybackControlsWithThen } from 'motion/react'
import { useCallback, useEffect, useEffectEvent, useRef } from 'react'
import { Embers } from './Embers'

/*
 * ANIMATION D'ENTRÉE BMC FOOD — à chaque arrivée sur le site et à chaque rechargement.
 *
 * Partition (secondes) :
 *   0,0  le halo doré s'allume sur le noir BMC, les braises montent (couverture de la charte, page 1)
 *   0,2  la toque tombe et se pose, avec un léger écrasement à l'atterrissage
 *   0,8  « BmC » s'écrit de gauche à droite
 *   1,3  « Food » et ses traits dorés suivent
 *   1,7  la signature « Le goût du vrai plaisir » apparaît lettre par lettre, un trait d'or se déroule
 *   1,9  un reflet de lumière balaie le logo
 *   2,6  sortie : le rideau noir se lève, bord doré lumineux, pendant que le logo s'envole
 *        et se pose exactement à sa place dans l'en-tête. Le site est là.
 *
 * Le logo est assemblé à partir de trois calques découpés dans le logo officiel (toque, « BmC », « Food ») :
 * au repos, ils redonnent pixel pour pixel le logo de la charte, jamais déformé ni recoloré (page 5).
 * Un appui, un clic ou une touche passe l'animation. « Réduire les animations » : simple fondu.
 */

const LAYERS = {
  toque: '/images/intro/intro-toque.webp',
  bmc: '/images/intro/intro-bmc.webp',
  food: '/images/intro/intro-food.webp',
} as const
/** Logo complet, sert de masque au reflet lumineux. */
const LOGO_MASK = '/images/brand/logo-principal.webp'
const TAGLINE = 'Le goût du vrai plaisir'
/** On n'attend jamais plus longtemps le chargement des images et des polices. */
const ASSETS_TIMEOUT_MS = 1400

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
const EASE_WRITE = [0.65, 0, 0.35, 1] as const

/** Images décodées et polices prêtes : l'animation ne démarre pas sur un logo à moitié chargé. */
function waitForAssets(): Promise<void> {
  const images = [...Object.values(LAYERS), LOGO_MASK].map((src) => {
    const image = new Image()
    image.src = src
    return image.decode().catch(() => undefined)
  })
  const ready = Promise.all([...images, document.fonts.ready.catch(() => undefined)]).then(() => undefined)
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, ASSETS_TIMEOUT_MS))
  return Promise.race([ready, timeout])
}

interface IntroSplashProps {
  /** Appelé quand le site est entièrement dévoilé : l'intro peut être retirée. */
  onFinish: () => void
}

export function IntroSplash({ onFinish }: IntroSplashProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const shouldReduceMotion = useReducedMotion()
  const skipRequested = useRef(false)
  const playing = useRef<AnimationPlaybackControlsWithThen | null>(null)
  const finish = useEffectEvent(onFinish)

  const skip = useCallback(() => {
    if (skipRequested.current) return
    skipRequested.current = true
    // Le spectacle en cours se termine en un instant ; la sortie démarre aussitôt, en accéléré.
    playing.current?.complete()
  }, [])

  useEffect(() => {
    let cancelled = false
    const running: AnimationPlaybackControlsWithThen[] = []
    const track = (controls: AnimationPlaybackControlsWithThen) => {
      running.push(controls)
      playing.current = controls
      return controls
    }

    const root = document.documentElement
    root.dataset.intro = 'playing'
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Une entrée sur le site commence en haut de page, logo de l'en-tête bien visible pour l'atterrissage.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    const handleKey = () => skip()
    window.addEventListener('keydown', handleKey)

    const playEntrance = () => {
      if (shouldReduceMotion) {
        return track(
          animate([
            ['.intro-glow', { opacity: [0, 1] }, { duration: 0.4 }],
            // Aucun déplacement : le logo complet apparaît en fondu.
            [
              '.intro-layer',
              { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'], opacity: [0, 1] },
              { duration: 0.5, at: 0 },
            ],
            ['.intro-letter', { opacity: 1 }, { duration: 0.4, at: 0.2 }],
            ['.intro-rule', { scaleX: [1, 1], opacity: [0, 1] }, { duration: 0.4, at: 0.2 }],
            ['.intro-hold', { opacity: 1 }, { duration: 0.6 }],
          ]),
        )
      }
      return track(
        animate([
          ['.intro-glow', { opacity: [0, 1], scale: [0.55, 1] }, { duration: 1.2, ease: EASE_OUT_EXPO, at: 0 }],
          ['.intro-embers', { opacity: [0, 1] }, { duration: 1, at: 0.1 }],
          // La toque tombe…
          [
            '.intro-toque',
            { y: ['-90%', '0%'], rotate: [-12, 0], opacity: [0, 1] },
            { type: 'spring', stiffness: 260, damping: 17, mass: 0.9, at: 0.2 },
          ],
          // …et s'écrase un peu en se posant.
          [
            '.intro-toque-squash',
            { scaleX: [1, 1.09, 0.97, 1], scaleY: [1, 0.86, 1.04, 1] },
            { duration: 0.5, ease: 'easeOut', at: 0.62 },
          ],
          // « BmC » s'écrit à la main, de gauche à droite.
          ['.intro-bmc', { clipPath: ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: 0.8, ease: EASE_WRITE, at: 0.8 }],
          ['.intro-food', { clipPath: ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: 0.65, ease: EASE_WRITE, at: 1.3 }],
          // Le logo respire une fois, complet.
          ['.intro-logo-pulse', { scale: [1, 1.035, 1] }, { duration: 0.7, ease: 'easeInOut', at: 1.85 }],
          ['.intro-shine', { x: ['-130%', '330%'] }, { duration: 1, ease: 'easeInOut', at: 1.9 }],
          [
            '.intro-letter',
            { opacity: [0, 1], y: [12, 0], filter: ['blur(6px)', 'blur(0px)'] },
            { duration: 0.45, delay: stagger(0.035), ease: EASE_OUT_EXPO, at: 1.7 },
          ],
          ['.intro-rule', { scaleX: [0, 1] }, { duration: 0.7, ease: EASE_OUT_EXPO, at: 2.05 }],
          // Un temps de pose avant la sortie.
          ['.intro-hold', { opacity: 1 }, { duration: 0.25, at: 2.35 }],
        ]),
      )
    }

    const playExit = (fast: boolean) => {
      // « Réduire les animations » : pas de rideau ni d'envol, un simple fondu vers le site.
      if (shouldReduceMotion && scope.current) {
        return track(animate(scope.current, { opacity: 0 }, { duration: 0.45 })).then(() => undefined)
      }
      const pace = fast ? 0.6 : 1
      const logo = scope.current?.querySelector<HTMLElement>('.intro-logo')
      const target = document.querySelector<HTMLElement>('[data-intro-target]')
      const targetBox = target?.getBoundingClientRect()
      const animations = [
        animate('.intro-fade', { opacity: 0, y: -10 }, { duration: 0.3 * pace, ease: 'easeIn' }),
        animate(
          '.intro-curtain',
          { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] },
          { duration: 0.9 * pace, ease: EASE_IN_OUT, delay: 0.15 * pace },
        ),
        animate('.intro-edge', { top: ['100%', '0%'], opacity: [0, 1, 1, 0] }, { duration: 0.9 * pace, ease: EASE_IN_OUT, delay: 0.15 * pace }),
      ]

      if (logo && targetBox && targetBox.width > 0 && !shouldReduceMotion) {
        // Le logo s'envole et se pose exactement sur celui de l'en-tête (même image, même proportions).
        const logoBox = logo.getBoundingClientRect()
        animations.push(
          animate(
            logo,
            {
              x: targetBox.left + targetBox.width / 2 - (logoBox.left + logoBox.width / 2),
              y: targetBox.top + targetBox.height / 2 - (logoBox.top + logoBox.height / 2),
              scale: targetBox.height / logoBox.height,
            },
            { duration: 0.9 * pace, ease: EASE_IN_OUT, delay: 0.1 * pace },
          ),
        )
      } else if (logo) {
        animations.push(animate(logo, { opacity: 0, scale: 0.94 }, { duration: 0.45 * pace }))
      }
      animations.forEach(track)
      return Promise.all(animations).then(() => undefined)
    }

    const run = async () => {
      await waitForAssets()
      if (cancelled) return
      if (!skipRequested.current) await playEntrance()
      if (cancelled) return
      await playExit(skipRequested.current)
      if (cancelled) return
      delete root.dataset.intro
      finish()
    }
    void run()

    return () => {
      cancelled = true
      running.forEach((controls) => controls.stop())
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      delete root.dataset.intro
    }
  }, [animate, scope, shouldReduceMotion, skip])

  return (
    <div
      ref={scope}
      onPointerDown={skip}
      className="fixed inset-0 z-[100] cursor-pointer select-none overflow-hidden"
    >
      {/* Rideau : noir BMC, halo doré et braises. Il se lève pour dévoiler le site. */}
      <div className="intro-curtain absolute inset-0 bg-bmc-black [clip-path:inset(0%_0%_0%_0%)]">
        <div
          aria-hidden="true"
          className="intro-glow absolute left-1/2 top-[44%] size-[min(140vw,62rem)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 [background:radial-gradient(circle,rgb(252_184_0/0.22)_0%,rgb(207_74_8/0.08)_38%,transparent_68%)]"
        />
        <div className="intro-embers absolute inset-0 opacity-0">
          <Embers variant="intro" rise={900} />
        </div>
        {/* Vignettage : le regard reste au centre. */}
        <div aria-hidden="true" className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_45%,rgb(0_0_0/0.65)_100%)]" />
      </div>

      {/* Bord doré lumineux qui monte avec le rideau. */}
      <div
        aria-hidden="true"
        className="intro-edge absolute inset-x-0 top-full h-px bg-bmc-gold opacity-0 shadow-[0_0_24px_4px_rgb(252_184_0/0.55),0_0_80px_12px_rgb(207_74_8/0.35)]"
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 pb-[6vh]">
        <p className="sr-only">BMC Food, le goût du vrai plaisir.</p>

        {/* Logo assemblé : même cadre que logo-principal.webp (640 × 483). */}
        <div className="intro-logo relative aspect-[640/483] w-[min(68vw,22rem)] lg:w-[26rem]">
          <div className="intro-logo-pulse absolute inset-0">
            <div className="intro-toque intro-layer absolute inset-0 opacity-0">
              <div className="intro-toque-squash absolute inset-0 origin-[50%_42%]">
                <img src={LAYERS.toque} alt="" draggable={false} className="absolute inset-0 size-full" />
              </div>
            </div>
            <img
              src={LAYERS.bmc}
              alt=""
              draggable={false}
              className="intro-bmc intro-layer absolute inset-0 size-full [clip-path:inset(0%_100%_0%_0%)]"
            />
            <img
              src={LAYERS.food}
              alt=""
              draggable={false}
              className="intro-food intro-layer absolute inset-0 size-full [clip-path:inset(0%_100%_0%_0%)]"
            />
            {/* Reflet : la lumière ne touche que les tracés du logo. */}
            <div
              aria-hidden="true"
              className="intro-fade absolute inset-0 overflow-hidden"
              style={{ maskImage: `url(${LOGO_MASK})`, maskSize: '100% 100%', WebkitMaskImage: `url(${LOGO_MASK})`, WebkitMaskSize: '100% 100%' }}
            >
              <div className="intro-shine absolute inset-y-0 left-0 w-1/3 -translate-x-[130%] -skew-x-12 bg-linear-to-r from-transparent via-white/80 to-transparent" />
            </div>
          </div>
        </div>

        {/* Signature de la couverture de la charte : or, capitales espacées. */}
        <div className="intro-fade flex flex-col items-center gap-4">
          <p aria-hidden="true" className="flex font-display text-sm font-bold uppercase tracking-[0.38em] text-bmc-gold sm:text-base">
            {Array.from(TAGLINE).map((letter, index) => (
              <span key={index} className="intro-letter inline-block opacity-0">
                {letter === ' ' ? ' ' : letter}
              </span>
            ))}
          </p>
          <span aria-hidden="true" className="intro-rule h-[3px] w-14 origin-center scale-x-0 rounded-full bg-bmc-gold" />
        </div>
        <span aria-hidden="true" className="intro-hold absolute opacity-0" />
      </div>

      <button
        type="button"
        onClick={skip}
        className="intro-fade absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold tracking-wide text-zinc-300 transition-colors hover:border-bmc-gold/60 hover:text-white"
      >
        Passer l'intro
      </button>
    </div>
  )
}
