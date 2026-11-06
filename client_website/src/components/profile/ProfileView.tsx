import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Heart,
  ChevronRight,
  LocateFixed,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Star,
  Trash2,
  User,
} from 'lucide-react'
import { formatFcfa } from '../../lib/format'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { DeliveryZoneSelect } from '../checkout/DeliveryZoneSelect'
import {
  type ClientProfile,
  type OrderSummary,
  clearClientData,
  loadHistory,
  loadProfile,
  refreshHistory,
  saveProfile,
  toggleFavoriteOrder,
  USER_KEY,
} from '../../services/clientData'
import type { ClientUser } from '../auth/AuthModal'
import type { OrderStatus } from '../../types'

interface ProfileViewProps {
  user: ClientUser | null
  onUserChange: (user: ClientUser) => void
  onLogout: () => void
  onOpenAuth: () => void
  onExploreMenu: () => void
  /** Remet les plats d'une ancienne commande dans le panier ; renvoie le nombre d'articles ajoutés et de plats introuvables. */
  onReorder: (order: OrderSummary) => { added: number; missing: number }
}

type Tab = 'profile' | 'orders' | 'settings'

const WHATSAPP_NUMBER = '221778561313'
const PHONE_PATTERN = /^(?:\+221|00221)?(?:7[05678]|33)\d{7}$/

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profil' },
  { id: 'orders', label: 'Commandes' },
  { id: 'settings', label: 'Réglages' },
]

/** Étapes d'une commande, dans l'ordre : sert à remplir la barre de progression. */
const ORDER_STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered']

const STATUS: Record<OrderStatus, { label: string; chip: string }> = {
  pending: { label: 'En attente', chip: 'bg-white/10 text-zinc-200' },
  confirmed: { label: 'Confirmée', chip: 'bg-bmc-gold/15 text-bmc-gold' },
  preparing: { label: 'En préparation', chip: 'bg-bmc-gold/15 text-bmc-gold' },
  delivering: { label: 'En livraison', chip: 'bg-bmc-gold/15 text-bmc-gold' },
  delivered: { label: 'Livrée', chip: 'bg-green-500/15 text-green-400' },
  cancelled: { label: 'Annulée', chip: 'bg-red-500/15 text-red-400' },
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-zinc-950 px-3.5 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors ${
    hasError ? 'border-bmc-error' : 'border-white/10 focus:border-bmc-gold'
  }`

const primaryButton =
  'inline-flex h-12 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-bmc-gold px-6 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40'
const outlineButton =
  'inline-flex h-12 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:border-white/30'

/** Fondu de la photo vers la couleur de la carte, en paliers progressifs (aucune coupure nette). */
const card = (opacity: number) => `color-mix(in oklab, var(--color-zinc-900) ${opacity}%, transparent)`
const CARD_FADE = `linear-gradient(to top, ${card(100)} 0%, ${card(84)} 26%, ${card(46)} 54%, ${card(12)} 82%, transparent 100%)`

function formatDate(iso: string, short = false): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return short
    ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : date.toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

/** Bloc d'un groupe de champs : surface chaude, icône dorée et titre. */
function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="warm-card rounded-2xl border bg-zinc-900 p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg font-bold text-white">
        <Icon className="size-5 text-bmc-gold" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-sm text-red-400">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  )
}

/** Barre de progression d'une commande : 5 segments remplis jusqu'à l'étape en cours. */
function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return null
  const reached = ORDER_STEPS.indexOf(status)
  return (
    <div className="mt-3 flex gap-1" aria-hidden="true">
      {ORDER_STEPS.map((step, index) => (
        <span key={step} className={`h-1.5 flex-1 rounded-full ${index <= reached ? 'bg-bmc-gold' : 'bg-white/10'}`} />
      ))}
    </div>
  )
}

/** Page « Mon compte » : profil, commandes, réglages. */
export function ProfileView({ user, onUserChange, onLogout, onOpenAuth, onExploreMenu, onReorder }: ProfileViewProps) {
  const [tab, setTab] = useState<Tab>('profile')
  const [draft, setDraft] = useState<ClientProfile>(() => {
    const stored = loadProfile()
    if (stored.firstName || stored.lastName || !user) return stored
    const [first = '', ...rest] = user.name.trim().split(/\s+/)
    return { ...stored, firstName: first, lastName: rest.join(' '), email: user.email ?? stored.email }
  })
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [errors, setErrors] = useState<{ phone?: string; phone2?: string; email?: string }>({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<OrderSummary[]>(loadHistory)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [ordersView, setOrdersView] = useState<'all' | 'favorites'>('all')
  const [reorderNote, setReorderNote] = useState<string | null>(null)

  const favoritesCount = history.filter((order) => order.favorite).length
  const shownOrders = ordersView === 'favorites' ? history.filter((order) => order.favorite) : history

  const toggleFavorite = (orderRef: string) => setHistory(toggleFavoriteOrder(orderRef))

  const reorder = (order: OrderSummary) => {
    const { added, missing } = onReorder(order)
    setReorderNote(
      added > 0
        ? ` article${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} au panier${missing > 0 ? `. ${missing} plat${missing > 1 ? 's ne sont' : ' n’est'} plus disponible${missing > 1 ? 's' : ''}.` : '.'}`
        : 'Ces plats ne sont plus disponibles.',
    )
  }

  const refresh = async () => {
    setIsRefreshing(true)
    setHistory(await refreshHistory(loadHistory()))
    setIsRefreshing(false)
  }

  // Au premier affichage, met à jour le statut des commandes récentes (silencieux si le serveur est injoignable).
  useEffect(() => {
    let cancelled = false
    refreshHistory(loadHistory()).then((list) => {
      if (!cancelled) setHistory(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(false), 2500)
    return () => window.clearTimeout(timer)
  }, [saved])

  const initials = useMemo(() => {
    const source = `${draft.firstName} ${draft.lastName}`.trim() || user?.name || ''
    return (
      source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '?'
    )
  }, [draft.firstName, draft.lastName, user?.name])

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-16 pt-8 sm:px-6">
        <div className="warm-card overflow-hidden rounded-2xl border bg-zinc-900 text-center">
          <div className="relative h-40 overflow-hidden">
            <img
              src="/images/hero/tacos_mixte_pane_cut.webp"
              alt=""
              className="absolute inset-0 size-full object-cover"
              decoding="async"
            />
            <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: CARD_FADE }} />
          </div>
          <div className="px-6 pb-8">
            <h1 className="font-display text-2xl font-bold text-white">Mon compte</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-300">
              Connectez-vous pour retrouver vos informations, vos commandes et vos préférences.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button type="button" onClick={onOpenAuth} className={primaryButton}>
                Se connecter
              </button>
              <button type="button" onClick={onExploreMenu} className={outlineButton}>
                Voir la carte
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const update = (patch: Partial<ClientProfile>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setDirty(true)
    setSaved(false)
  }

  const save = () => {
    const next: typeof errors = {}
    if (!PHONE_PATTERN.test(phone.replace(/\s+/g, ''))) next.phone = 'Numéro invalide (ex. 77 856 13 13).'
    if (draft.phone2.trim() && !PHONE_PATTERN.test(draft.phone2.replace(/\s+/g, ''))) {
      next.phone2 = 'Numéro invalide (ex. 77 856 13 13).'
    }
    if (draft.email.trim() && !/^\S+@\S+\.\S+$/.test(draft.email.trim())) next.email = 'Adresse email invalide.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    saveProfile(draft)
    const fullName = `${draft.firstName} ${draft.lastName}`.trim() || user.name
    const updated: ClientUser = { name: fullName, phone: phone.replace(/\s+/g, ''), email: draft.email.trim() || undefined }
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
    } catch {
      /* le profil reste valable pour la session */
    }
    onUserChange(updated)
    setDirty(false)
    setSaved(true)
  }

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setGeoState('error')
      return
    }
    setGeoState('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        setGeoState('idle')
      },
      () => setGeoState('error'),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const sendFeedback = () => {
    if (rating === 0) {
      setFeedbackError('Choisissez une note de 1 à 5.')
      return
    }
    setFeedbackError('')
    const text = ['Avis BMC Food', `Note : ${rating}/5`, feedback.trim(), `${user.name} – ${user.phone}`]
      .filter(Boolean)
      .join('\n')
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const hasPosition = draft.latitude !== undefined && draft.longitude !== undefined
  const lastOrder = history[0]

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pb-20 pt-5 sm:px-6 sm:pt-8">
      {/* ============ Carte d'identité : photo, avatar, chiffres ============ */}
      <header className="warm-card overflow-hidden rounded-2xl border bg-zinc-900">
        <div className="relative h-28 overflow-hidden sm:h-36">
          <img
            src="/images/hero/tacos_mixte_pane_cut.webp"
            alt=""
            className="absolute inset-0 size-full object-cover object-[60%_center]"
            decoding="async"
          />
          <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: CARD_FADE }} />
        </div>

        <div className="relative z-10 -mt-9 flex items-end gap-4 px-5">
          <div
            aria-hidden="true"
            className="grid size-[4.5rem] shrink-0 place-items-center rounded-full bg-bmc-gold font-display text-2xl font-bold text-black ring-4 ring-zinc-900"
          >
            {initials}
          </div>
          <div className="min-w-0 pb-1">
            <h1 className="truncate font-display text-2xl font-bold leading-tight text-white">{user.name}</h1>
            <p className="truncate text-sm tabular-nums text-zinc-300">{user.phone}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
          {[
            { label: 'Commandes', value: String(history.length) },
            { label: 'Dernière commande', value: lastOrder ? formatDate(lastOrder.created_at, true) : '—' },
          ].map((stat) => (
            <div key={stat.label} className="px-2 py-4 text-center">
              <dd className="font-display text-base font-bold tabular-nums text-bmc-gold sm:text-lg">{stat.value}</dd>
              <dt className="mt-0.5 text-xs text-zinc-400">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </header>

      {/* Onglets */}
      <div role="tablist" aria-label="Sections du compte" className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-zinc-900 p-1">
        {TABS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`h-11 cursor-pointer rounded-lg text-sm font-semibold transition-colors ${
                active ? 'bg-bmc-gold text-black' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* ============ Profil ============ */}
      {tab === 'profile' && (
        <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" className="space-y-5">
          <Panel icon={User} title="Identité">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="firstName" label="Prénom">
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={draft.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  className={inputClass(false)}
                />
              </Field>
              <Field id="lastName" label="Nom">
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={draft.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  className={inputClass(false)}
                />
              </Field>
            </div>
          </Panel>

          <Panel icon={Phone} title="Contact">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="phone" label="Téléphone" error={errors.phone}>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setDirty(true)
                      setSaved(false)
                    }}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={inputClass(Boolean(errors.phone))}
                  />
                </Field>
                <Field id="phone2" label="Deuxième numéro" error={errors.phone2}>
                  <input
                    id="phone2"
                    type="tel"
                    inputMode="tel"
                    value={draft.phone2}
                    onChange={(e) => update({ phone2: e.target.value })}
                    placeholder="Facultatif"
                    aria-invalid={Boolean(errors.phone2)}
                    aria-describedby={errors.phone2 ? 'phone2-error' : undefined}
                    className={inputClass(Boolean(errors.phone2))}
                  />
                </Field>
              </div>
              <Field id="email" label="Email" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={draft.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="Facultatif"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={inputClass(Boolean(errors.email))}
                />
              </Field>
            </div>
          </Panel>

          <Panel icon={MapPin} title="Livraison">
            <div className="space-y-4">
              <DeliveryZoneSelect value={draft.areaId ?? ''} onChange={(areaId) => update({ areaId })} />

              <Field id="address" label="Adresse habituelle">
                <textarea
                  id="address"
                  rows={2}
                  value={draft.address}
                  onChange={(e) => update({ address: e.target.value })}
                  placeholder="Quartier, rue, repère"
                  className={`${inputClass(false)} resize-none`}
                />
              </Field>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <button
                  type="button"
                  onClick={locate}
                  disabled={geoState === 'loading'}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 text-sm font-medium text-bmc-gold transition-colors hover:text-white disabled:opacity-50"
                >
                  <LocateFixed className="size-4" aria-hidden="true" />
                  {geoState === 'loading' ? 'Recherche de votre position…' : 'Utiliser ma position'}
                </button>
                {hasPosition && (
                  <>
                    <a
                      href={`https://maps.google.com/?q=${draft.latitude},${draft.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-300 underline underline-offset-4 transition-colors hover:text-white"
                    >
                      Voir sur la carte
                    </a>
                    <button
                      type="button"
                      onClick={() => update({ latitude: undefined, longitude: undefined })}
                      className="cursor-pointer text-sm text-zinc-400 underline underline-offset-4 transition-colors hover:text-white"
                    >
                      Effacer
                    </button>
                  </>
                )}
              </div>

              {geoState === 'error' && (
                <p role="alert" className="flex items-center gap-1 text-sm text-red-400">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  Position indisponible. Autorisez la localisation dans votre navigateur.
                </p>
              )}
              <p className="text-sm text-zinc-400">
                Ces informations restent sur votre téléphone et préremplissent vos commandes.
              </p>
            </div>
          </Panel>

          <div className="flex items-center gap-4">
            <button type="button" onClick={save} disabled={!dirty} className={`${primaryButton} w-full sm:w-auto`}>
              Enregistrer
            </button>
            {saved && (
              <p role="status" className="flex items-center gap-1.5 text-sm text-green-400">
                <Check className="size-4" aria-hidden="true" /> Enregistré
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============ Commandes ============ */}
      {tab === 'orders' && (
        <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders">
          {history.length === 0 ? (
            <div className="warm-card overflow-hidden rounded-2xl border bg-zinc-900 text-center">
              <div className="relative h-40 overflow-hidden">
                <img
                  src="/images/products/tacos-mixte-pane.webp"
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
                <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: CARD_FADE }} />
              </div>
              <div className="px-6 pb-8">
                <p className="font-display text-xl font-bold text-white">Pas encore de commande</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-300">
                  Vos prochaines commandes apparaîtront ici avec leur statut.
                </p>
                <button type="button" onClick={onExploreMenu} className={`${primaryButton} mt-5`}>
                  Voir la carte
                </button>
              </div>
            </div>
          ) : (
            <>
              <div role="group" aria-label="Afficher" className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-zinc-900 p-1">
                {(
                  [
                    ['all', `Historique (${history.length})`],
                    ['favorites', `Favorites (${favoritesCount})`],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={ordersView === value}
                    onClick={() => setOrdersView(value)}
                    className={`h-10 cursor-pointer rounded-lg text-sm font-semibold transition-colors ${
                      ordersView === value ? 'bg-bmc-gold text-black' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {reorderNote && (
                <p role="status" className="mb-3 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                  <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{reorderNote}</span>
                </p>
              )}

              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="font-display text-lg font-bold text-white">
                  {shownOrders.length} commande{shownOrders.length > 1 ? 's' : ''}
                </h2>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={isRefreshing}
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 text-sm font-medium text-bmc-gold transition-colors hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                  Actualiser
                </button>
              </div>

              {shownOrders.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-zinc-400">
                  Touchez le cœur d’une commande pour la retrouver ici.
                </p>
              )}

              <ul className="space-y-3">
                {shownOrders.map((order) => {
                  const status = STATUS[order.status] ?? STATUS.pending
                  return (
                    <li key={order.order_ref} className="warm-card overflow-hidden rounded-2xl border bg-zinc-900">
                      <details className="group">
                        <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-display text-base font-bold tabular-nums text-white">{order.order_ref}</p>
                              <p className="text-sm text-zinc-400">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <p className="font-display text-base font-bold tabular-nums text-bmc-gold">
                                {formatFcfa(order.total_amount)}
                              </p>
                              <ChevronDown
                                className="size-4 text-zinc-400 transition-transform group-open:rotate-180"
                                aria-hidden="true"
                              />
                            </div>
                          </div>
                          <p className="mt-2 line-clamp-1 text-sm text-zinc-300">
                            {order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}
                          </p>
                          <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.chip}`}>
                            {status.label}
                          </span>
                          <OrderProgress status={order.status} />
                        </summary>
                        <ul className="space-y-1.5 border-t border-white/10 px-4 py-3 text-sm text-zinc-300">
                          {order.items.map((item) => (
                            <li key={item.name} className="flex justify-between gap-3">
                              <span>{item.name}</span>
                              <span className="tabular-nums text-zinc-400">× {item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                      <div className="flex gap-2 border-t border-white/10 p-3">
                        <button
                          type="button"
                          onClick={() => reorder(order)}
                          className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-bmc-gold text-sm font-semibold text-black transition-colors hover:bg-amber-400"
                        >
                          <RotateCcw className="size-4" aria-hidden="true" />
                          Commander à nouveau
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(order.order_ref)}
                          aria-pressed={Boolean(order.favorite)}
                          aria-label={order.favorite ? `Retirer la commande ${order.order_ref} des favorites` : `Ajouter la commande ${order.order_ref} aux favorites`}
                          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/15 transition-colors hover:border-white/35"
                        >
                          <Heart
                            className={`size-5 transition-colors ${order.favorite ? 'fill-bmc-gold text-bmc-gold' : 'text-zinc-300'}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-4 px-1 text-sm text-zinc-400">
                L’historique est gardé sur cet appareil. Les statuts se mettent à jour quand le serveur répond.
              </p>
            </>
          )}
        </div>
      )}

      {/* ============ Réglages ============ */}
      {tab === 'settings' && (
        <div id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" className="space-y-5">
          <Panel icon={Star} title="Votre avis">
            <div className="space-y-4">
              <div role="radiogroup" aria-label="Note de 1 à 5" className="-ml-1 flex">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} sur 5`}
                    onClick={() => {
                      setRating(value)
                      setFeedbackError('')
                    }}
                    className="grid size-11 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-white/5"
                  >
                    <Star
                      className={`size-7 transition-colors ${value <= rating ? 'fill-bmc-gold text-bmc-gold' : 'text-zinc-600'}`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
              <textarea
                aria-label="Votre message"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ce que vous avez aimé, ce que nous pouvons améliorer"
                className={`${inputClass(false)} resize-none`}
              />
              {feedbackError && (
                <p role="alert" className="flex items-center gap-1 text-sm text-red-400">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> {feedbackError}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <button type="button" onClick={sendFeedback} className={primaryButton}>
                  Envoyer sur WhatsApp
                </button>
                <p className="text-sm text-zinc-400">Votre avis arrive directement à l’équipe.</p>
              </div>
            </div>
          </Panel>

          <section className="warm-card overflow-hidden rounded-2xl border bg-zinc-900">
            <h2 className="px-5 pb-1 pt-5 font-display text-lg font-bold text-white sm:px-6">Compte</h2>
            <div className="divide-y divide-white/10">
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className="flex h-14 w-full cursor-pointer items-center justify-between px-5 text-left text-sm font-medium text-white transition-colors hover:bg-white/5 sm:px-6"
              >
                <span className="flex items-center gap-3">
                  <LogOut className="size-4 text-bmc-gold" aria-hidden="true" />
                  Se déconnecter
                </span>
                <ChevronRight className="size-4 text-zinc-500" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-14 w-full cursor-pointer items-center justify-between px-5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/5 sm:px-6"
              >
                <span className="flex items-center gap-3">
                  <Trash2 className="size-4" aria-hidden="true" />
                  Supprimer mes données
                </span>
                <ChevronRight className="size-4 text-red-400/60" aria-hidden="true" />
              </button>
            </div>
            <p className="px-5 pb-5 pt-3 text-sm text-zinc-400 sm:px-6">
              Efface votre profil et votre historique de cet appareil. Vos commandes passées restent chez BMC Food.
            </p>
          </section>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Se déconnecter ?"
        description="Vous serez déconnecté de votre compte BMC Food sur cet appareil."
        confirmLabel="Oui, me déconnecter"
        cancelLabel="Rester connecté"
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false)
          onLogout()
        }}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Supprimer vos données ?"
        description="Votre profil, votre adresse et l’historique de commandes seront effacés de cet appareil. Cette action est définitive."
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          clearClientData()
          setConfirmDelete(false)
          onLogout()
        }}
      />
    </div>
  )
}
