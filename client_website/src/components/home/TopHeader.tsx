import { useEffect, useState } from 'react'
import { Menu, Phone, Search } from 'lucide-react'
import { isOpenAt } from '../../lib/greeting'

interface TopHeaderProps {
  cartItemCount?: number
  onOpenCart?: () => void
  onOpenSearch?: () => void
  onToggleMenu?: () => void
  onSelectCategory?: (categoryId: string) => void
  currentPage?: 'home' | 'menu' | 'contact' | 'profile'
  onNavigate?: (page: 'home' | 'menu' | 'contact') => void
  onOpenAuth?: () => void
  clientUser?: { name: string; phone: string } | null
}

const NAV_ITEMS: { page: 'home' | 'menu' | 'contact'; label: string }[] = [
  { page: 'home', label: 'Accueil' },
  { page: 'menu', label: 'La carte' },
  { page: 'contact', label: 'Contact' },
]

/** Au-delà de ce défilement (px), l'en-tête passe en version compacte et translucide. */
const COMPACT_AFTER = 24
/** Il ne se masque qu'après cette distance, et réapparaît dès qu'on remonte un peu. */
const HIDE_AFTER = 200
const SCROLL_STEP = 8

/**
 * En-tête BMC Food, dynamique au défilement :
 * - en haut de page : grand (logo et nom bien visibles) ;
 * - dès qu'on descend : il rétrécit nettement, le nom du restaurant s'efface, le fond devient translucide avec flou ;
 * - quand on descend vite : il se glisse hors de l'écran ; il revient dès qu'on remonte ;
 * Il est en position fixe, avec un espace réservé de la hauteur maximale : la page ne bouge pas quand il change de taille.
 */
export function TopHeader({
  onOpenSearch,
  onToggleMenu,
  currentPage = 'home',
  onNavigate,
  onOpenAuth,
  clientUser,
}: TopHeaderProps) {
  const isOpen = isOpenAt()
  const [compact, setCompact] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    const update = () => {
      const y = window.scrollY
      const delta = y - lastY
      setCompact(y > COMPACT_AFTER)

      if (y < HIDE_AFTER) {
        setHidden(false)
      } else if (delta > SCROLL_STEP) {
        setHidden(true)
      } else if (delta < -SCROLL_STEP) {
        setHidden(false)
      }
      if (Math.abs(delta) > SCROLL_STEP) lastY = y

      ticking = false
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      {/* Espace réservé : la hauteur maximale de l'en-tête, pour que le contenu ne saute jamais */}
      <div aria-hidden="true" className="h-[4.5rem] sm:h-20" />

      <header
        onFocusCapture={() => setHidden(false)}
        className={`fixed inset-x-0 top-0 z-40 border-b transition-[transform,background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out motion-reduce:transition-none ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        } ${
          compact
            ? 'border-white/10 bg-zinc-950/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl'
            : 'border-transparent bg-zinc-950'
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-[height] duration-300 ease-out motion-reduce:transition-none sm:px-6 lg:px-8 ${
            compact ? 'h-14' : 'h-[4.5rem] sm:h-20'
          }`}
        >
          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="flex cursor-pointer items-center gap-3 rounded-lg py-1 text-left transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-bmc-gold"
            aria-label="BMC Food, accueil"
          >
            <img
              src="/images/brand/logo.png"
              alt="BMC Food"
              width={140}
              height={56}
              className={`w-auto object-contain transition-[height] duration-300 ease-out motion-reduce:transition-none ${
                compact ? 'h-9' : 'h-12 sm:h-14'
              }`}
            />
            <span
              className={`hidden overflow-hidden whitespace-nowrap font-display font-bold text-white transition-[max-width,opacity,font-size] duration-300 ease-out motion-reduce:transition-none sm:block ${
                compact ? 'max-w-0 text-base opacity-0' : 'max-w-40 text-xl opacity-100'
              }`}
            >
              BMC Food
            </span>
          </button>

          <nav aria-label="Navigation principale" className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.page}
                type="button"
                onClick={() => onNavigate?.(item.page)}
                aria-current={currentPage === item.page ? 'page' : undefined}
                className={`relative cursor-pointer py-1 text-sm font-medium transition-colors ${
                  currentPage === item.page
                    ? 'text-bmc-gold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-bmc-gold'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}

            <span className="flex items-center gap-2 text-sm text-zinc-400">
              <span className={`size-2 rounded-full ${isOpen ? 'bg-bmc-success' : 'bg-zinc-500'}`} />
              {isOpen ? 'Ouvert · jusqu’à 02h' : 'Fermé'}
            </span>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenAuth}
              aria-label={clientUser ? `Mon compte (${clientUser.name})` : 'Connexion ou inscription'}
              className="flex h-11 cursor-pointer items-center rounded-lg border border-white/15 px-4 text-sm font-medium text-zinc-100 transition-colors hover:border-white/30"
            >
              {clientUser ? (
                <span className="max-w-20 truncate text-bmc-gold sm:max-w-none">{clientUser.name.split(' ')[0]}</span>
              ) : (
                <>
                  <span className="hidden sm:inline">Connexion</span>
                  <span className="sm:hidden">Compte</span>
                </>
              )}
            </button>

            <a
              href="tel:778561313"
              aria-label="Appeler le restaurant au 77 856 13 13"
              className="hidden h-10 items-center gap-2 rounded-lg border border-white/15 px-3.5 text-sm font-medium text-zinc-200 transition-colors hover:border-white/30 xl:inline-flex"
            >
              <Phone className="size-4 text-bmc-gold" />
              <span>77 856 13 13</span>
            </a>

            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Rechercher un plat"
              className="flex size-11 cursor-pointer items-center justify-center rounded-lg border border-white/15 text-zinc-200 transition-colors hover:border-white/30"
            >
              <Search className="size-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleMenu}
              aria-label="Ouvrir le menu de navigation"
              className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-bmc-gold lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

      </header>
    </>
  )
}
