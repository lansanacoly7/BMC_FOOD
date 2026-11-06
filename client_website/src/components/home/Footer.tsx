import { ArrowUp, MapPin, MessageCircle } from 'lucide-react'
import { isOpenAt } from '../../lib/greeting'

type Page = 'home' | 'menu' | 'contact' | 'profile'

interface FooterProps {
  onExploreMenu?: () => void
  onNavigate?: (page: Page) => void
}

const WHATSAPP_URL = 'https://wa.me/221778561313'
const MAPS_URL = 'https://maps.google.com/?q=PGXV%2B6R7,+Dakar'

const PAYMENTS = [
  { name: 'Wave', src: '/images/payments/wave.png' },
  { name: 'Orange Money', src: '/images/payments/orange_money.png' },
  { name: 'Espèces', src: '/images/payments/cash.png' },
]

const NAV_LINKS: { page: Page; label: string }[] = [
  { page: 'home', label: 'Accueil' },
  { page: 'menu', label: 'La carte' },
  { page: 'contact', label: 'Contact' },
  { page: 'profile', label: 'Mon compte' },
]

/** Semaine affichée dans la colonne Horaires (index = Date.getDay()). Le lundi est fermé. */
const WEEK = [
  { day: 1, letter: 'L', name: 'Lundi', open: false },
  { day: 2, letter: 'M', name: 'Mardi', open: true },
  { day: 3, letter: 'M', name: 'Mercredi', open: true },
  { day: 4, letter: 'J', name: 'Jeudi', open: true },
  { day: 5, letter: 'V', name: 'Vendredi', open: true },
  { day: 6, letter: 'S', name: 'Samedi', open: true },
  { day: 0, letter: 'D', name: 'Dimanche', open: true },
]

const columnTitle = 'font-display text-sm font-semibold text-white'
const linkClass = 'cursor-pointer text-left text-sm text-zinc-300 transition-colors hover:text-white'

export function Footer({ onNavigate }: FooterProps) {
  const isOpen = isOpenAt()
  const now = new Date()
  const today = now.getHours() < 2 ? (now.getDay() + 6) % 7 : now.getDay()

  return (
    <footer aria-label="Pied de page" className="mt-16 border-t border-white/10 bg-zinc-900 sm:mt-24">
      {/* ===== Colonnes ===== */}
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-12">
          <div className="col-span-2 space-y-4 lg:col-span-4">
            <div className="flex items-center gap-3">
              <img src="/images/brand/logo.png" alt="BMC Food" width={64} height={64} className="size-14 object-contain" />
              <p className="font-display text-xl font-bold text-white">BMC Food</p>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-300">
              Tacos, burgers et poulet crispy, préparés à la commande à Dakar.
            </p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-white"
            >
              <MapPin className="size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
              PGXV+6R7, Dakar
              <span className="text-bmc-gold underline underline-offset-4">Itinéraire</span>
            </a>
          </div>

          <nav aria-label="Navigation du pied de page" className="space-y-3 lg:col-span-2">
            <h3 className={columnTitle}>Naviguer</h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.page}>
                  <button type="button" onClick={() => onNavigate?.(link.page)} className={linkClass}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3 lg:col-span-2">
            <h3 className={columnTitle}>Horaires</h3>
            <p className="flex items-center gap-2 text-sm text-zinc-300">
              <span className={`size-2 shrink-0 rounded-full ${isOpen ? 'bg-bmc-success' : 'bg-zinc-500'}`} />
              {isOpen ? 'Ouvert maintenant' : 'Fermé pour le moment'}
            </p>
            <p className="text-sm text-zinc-300">
              Mardi – dimanche
              <br />
              <span className="tabular-nums">11h – 02h</span>
            </p>
            <ol className="flex gap-1.5 pt-1" aria-label="Jours d'ouverture">
              {WEEK.map((d) => (
                <li
                  key={d.day}
                  title={`${d.name} : ${d.open ? '11h – 02h' : 'fermé'}`}
                  aria-current={d.day === today ? 'date' : undefined}
                  className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${
                    d.day === today
                      ? 'bg-bmc-gold text-black'
                      : d.open
                        ? 'bg-white/10 text-zinc-200'
                        : 'border border-dashed border-white/20 text-zinc-500'
                  }`}
                >
                  {d.letter}
                </li>
              ))}
            </ol>
            <p className="text-sm text-zinc-400">Fermé le lundi</p>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <h3 className={columnTitle}>Livraison</h3>
            <p className="text-sm text-zinc-300">
              À partir de <span className="font-semibold tabular-nums text-white">1 000 F</span>
            </p>
            <p className="text-sm text-zinc-400">20 à 45 min selon le quartier</p>
            <button
              type="button"
              onClick={() => onNavigate?.('contact')}
              className={`${linkClass} text-bmc-gold underline underline-offset-4`}
            >
              Zones et tarifs
            </button>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <h3 className={columnTitle}>Nous joindre</h3>
            <p className="flex flex-col gap-2 text-sm text-zinc-300">
              <a href="tel:778561313" className="tabular-nums transition-colors hover:text-white">
                77 856 13 13
              </a>
              <a href="tel:771067575" className="tabular-nums transition-colors hover:text-white">
                77 106 75 75
              </a>
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-bmc-gold underline underline-offset-4 transition-colors hover:text-white"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Paiements */}
        <div className="mt-10 border-t border-white/10 pt-6 sm:flex sm:items-center sm:gap-6">
          <p className="mb-3 text-sm text-zinc-400 sm:mb-0">Paiement</p>
          <ul className="grid grid-cols-3 gap-2 sm:flex sm:gap-6">
            {PAYMENTS.map((payment) => (
              <li
                key={payment.name}
                className="flex flex-col items-center gap-2 rounded-xl bg-white/5 px-2 py-3 text-center text-xs text-zinc-200 sm:flex-row sm:gap-2 sm:bg-transparent sm:p-0 sm:text-sm"
              >
                <img
                  src={payment.src}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="size-8 rounded-md object-contain sm:size-7 sm:bg-white/5 sm:p-0.5"
                />
                {payment.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Barre du bas */}
        <div className="mt-6 flex flex-col-reverse items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-zinc-400 sm:flex-row">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} BMC Food Dakar</p>
            <p className="mt-0.5">
              Site réalisé par <span className="whitespace-nowrap text-zinc-300">Teranga Labs</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-white/30 hover:text-white"
          >
            Retour en haut
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
