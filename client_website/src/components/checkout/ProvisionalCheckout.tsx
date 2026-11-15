import { AlertTriangle, ArrowLeft, Check, Clock, ExternalLink, LoaderCircle, LocateFixed, Store, Truck } from 'lucide-react'
import { type FormEvent, useEffect, useId, useState } from 'react'
import { loadProfile, saveProfile, USER_KEY } from '../../services/clientData'
import { useCart } from '../../hooks/useCart'
import { useOpeningStatus } from '../../hooks/useOpeningStatus'
import { useOrderSubmission } from '../../hooks/useOrderSubmission'
import { OPENING_HOURS_LABEL } from '../../lib/openingHours'
import { findDeliveryArea } from '../../lib/delivery'
import { formatFcfa } from '../../lib/format'
import { getProductImageUrl } from '../../lib/productImages'
import type { OrderCustomerDetails, OrderField } from '../../services/orders'
import type { OrderType, PaymentMethod } from '../../types'
import { DeliveryZoneSelect } from './DeliveryZoneSelect'
import { OrderConfirmation } from './OrderConfirmation'
import { OrderSubmitButton } from './OrderSubmitButton'
import { OrderTotals } from './OrderTotals'
import { PaymentSelector } from './PaymentSelector'

interface CheckoutFormState {
  customer_name: string
  phone: string
  address: string
  notes: string
  has_allergy: boolean
  payment_method: PaymentMethod
}

const EMPTY_FORM: CheckoutFormState = {
  customer_name: '',
  phone: '',
  address: '',
  notes: '',
  has_allergy: false,
  payment_method: 'cash',
}

/** Mode de réception : livraison chez le client, ou à emporter (le client vient chercher sa commande au restaurant). */
const MODE_STORAGE_KEY = 'bmc_order_mode'
const RESTAURANT_ADDRESS = 'PGXV+6R7, Dakar'
const RESTAURANT_MAPS_URL = 'https://maps.google.com/?q=PGXV%2B6R7,+Dakar'

const MODES: { value: OrderType; label: string; hint: string; Icon: typeof Truck }[] = [
  { value: 'delivery', label: 'Livraison', hint: 'Chez vous, à Dakar', Icon: Truck },
  { value: 'pickup', label: 'À emporter', hint: 'Je viens le chercher', Icon: Store },
]

/** Nombre de plats montrés dans le récapitulatif avant « + N autres ». */
const VISIBLE_ITEMS = 3

/** Voile du bandeau : teinte du fond de page à une opacité donnée, en paliers progressifs (aucune coupure nette). */
const page = (opacity: number) => `color-mix(in oklab, var(--color-zinc-950) ${opacity}%, transparent)`
const BANNER_SCRIM = `linear-gradient(to right, ${page(96)} 0%, ${page(88)} 30%, ${page(66)} 52%, ${page(36)} 72%, ${page(12)} 88%, transparent 100%)`

interface ProvisionalCheckoutProps {
  /** Compte client connecté : ses coordonnées sont reprises dans le formulaire. */
  clientUser?: { name: string; phone: string } | null
  onBack: () => void
  onNewOrder: () => void
}

/**
 * Écran « Finaliser la commande » : deux colonnes sur grand écran (coordonnées à gauche, paiement et
 * récapitulatif à droite) pour tenir sans défiler ; une seule colonne compacte sur téléphone.
 */
export function ProvisionalCheckout({ clientUser, onBack, onNewOrder }: ProvisionalCheckoutProps) {
  const formId = useId()
  const { items, subtotal } = useCart()
  const { status, isSubmitting, order, error, submit, clearError, reset } = useOrderSubmission()
  // Fermé ou en pause (depuis /api/health/) : le formulaire reste rempli, mais l'envoi est bloqué.
  const opening = useOpeningStatus()
  const isOrderBlocked = !opening.acceptingOrders
  // Préremplit avec le compte connecté ou mémorisé et l'adresse enregistrée dans « Mon compte »
  const [form, setForm] = useState<CheckoutFormState>(() => {
    try {
      const user =
        clientUser ?? (JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as { name?: string; phone?: string } | null)
      const profile = loadProfile()
      return {
        ...EMPTY_FORM,
        customer_name: user?.name || profile.contactName || '',
        phone: user?.phone || profile.contactPhone || '',
        address: profile.address,
      }
    } catch {
      return EMPTY_FORM
    }
  })

  const [mode, setMode] = useState<OrderType>(() => {
    try {
      return localStorage.getItem(MODE_STORAGE_KEY) === 'pickup' ? 'pickup' : 'delivery'
    } catch {
      return 'delivery'
    }
  })
  // Quartier habituel mémorisé (s'il existe toujours dans la grille de livraison)
  const [selectedAreaId, setSelectedAreaId] = useState(() => {
    const saved = loadProfile().areaId
    return saved && findDeliveryArea(saved) ? saved : ''
  })
  const [areaError, setAreaError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationSuccess, setLocationSuccess] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const selectedArea = selectedAreaId ? findDeliveryArea(selectedAreaId) : undefined
  const isPickup = mode === 'pickup'
  // Pas de frais de livraison quand le client vient chercher sa commande
  const deliveryFee = isPickup ? undefined : selectedArea?.fee

  const changeMode = (next: OrderType) => {
    setMode(next)
    if (next === 'pickup') {
      setAreaError(null)
      if (error?.fieldErrors.delivery_area || error?.fieldErrors.address) clearError()
    }
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next)
    } catch {
      /* le choix vaut pour cette commande */
    }
  }

  const update = (field: 'customer_name' | 'phone' | 'address' | 'notes' | 'payment_method', value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (error?.fieldErrors[field]) clearError()
  }

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId)
    setAreaError(null)
    if (error?.fieldErrors.delivery_area) clearError()
    const area = findDeliveryArea(areaId)
    if (area && (!form.address || form.address.trim() === '')) {
      update('address', area.name)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur.")
      return
    }

    setIsLocating(true)
    setLocationError(null)
    setLocationSuccess(false)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const googleMapsUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'fr' } },
          )
          if (response.ok) {
            const data = await response.json()
            const road = data.address?.road || data.address?.pedestrian || ''
            const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || ''
            const label = [road, suburb].filter(Boolean).join(', ')
            update('address', label ? `${label} (${googleMapsUrl})` : `Position GPS : ${googleMapsUrl}`)
          } else {
            update('address', `Position GPS : ${googleMapsUrl}`)
          }
        } catch {
          update('address', `Position GPS : ${googleMapsUrl}`)
        } finally {
          setIsLocating(false)
          setLocationSuccess(true)
          setTimeout(() => setLocationSuccess(false), 4000)
        }
      },
      (err) => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Autorisation refusée. Autorisez la localisation ou saisissez votre adresse.')
        } else {
          setLocationError('Position introuvable. Saisissez votre adresse.')
        }
        setTimeout(() => setLocationError(null), 5000)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!opening.acceptingOrders) {
      void opening.refresh()
      return
    }
    if (!isPickup && !selectedAreaId.trim()) {
      setAreaError('Choisissez votre quartier de livraison.')
      return
    }
    const payload: OrderCustomerDetails = {
      customer_name: form.customer_name,
      phone: form.phone,
      order_type: mode,
      delivery_area: isPickup ? undefined : selectedAreaId,
      address: isPickup ? undefined : form.address,
      notes: form.notes,
      has_allergy: form.has_allergy,
      payment_method: form.payment_method,
    }
    void submit(payload).then((created) => {
      if (!created) void opening.refresh()
    })
  }

  // Une fois la commande acceptée, on mémorise coordonnées et adresse pour les prochaines commandes :
  // le client n'a plus à les ressaisir (il peut les modifier ici ou dans « Mon compte »).
  useEffect(() => {
    if (status !== 'success' || !order) return
    const profile = loadProfile()
    const next = { ...profile, contactName: form.customer_name.trim(), contactPhone: form.phone.trim() }
    if (!isPickup && form.address.trim()) {
      next.address = form.address.trim()
      if (selectedAreaId) next.areaId = selectedAreaId
      // Une position GPS partagée est reprise dans le profil (lien Google Maps contenu dans l'adresse)
      const gps = form.address.match(/q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
      if (gps) {
        next.latitude = Number(gps[1])
        next.longitude = Number(gps[2])
      }
    }
    saveProfile(next)
    // On ne mémorise qu'une fois par commande
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, order])

  // Écran de confirmation de commande : affiche uniquement les données renvoyées par le serveur
  if (status === 'success' && order) {
    return (
      <OrderConfirmation
        order={order}
        deliveryAreaName={selectedArea?.name}
        fulfillment={mode}
        onNewOrder={() => {
          reset()
          onNewOrder()
        }}
      />
    )
  }

  const fieldError = (field: OrderField) => error?.fieldErrors[field]
  const inputClass = (field: OrderField) =>
    `h-12 w-full rounded-lg border bg-zinc-950 px-3.5 text-base text-white placeholder:text-zinc-500 outline-none transition-colors sm:text-sm ${
      fieldError(field) ? 'border-red-500' : 'border-white/10 focus:border-bmc-gold'
    }`
  const labelClass = 'mb-1.5 block text-sm font-medium text-zinc-200'
  const card = 'warm-card rounded-2xl border bg-zinc-900 p-5'

  const visibleItems = items.slice(0, VISIBLE_ITEMS)
  const hiddenItems = items.length - visibleItems.length

  return (
    <div className="min-h-dvh bg-zinc-950 pb-16 text-zinc-100 selection:bg-bmc-gold selection:text-black">
      <div className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        {/* Bandeau : photo, titre, retour */}
        <header className="relative isolate mb-5 flex min-h-[104px] items-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
          <img
            src="/images/hero/tacos_mixte_pane_cut.webp"
            alt=""
            width={800}
            height={597}
            decoding="async"
            className="absolute inset-0 -z-20 size-full object-cover object-[80%_center]"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ backgroundImage: BANNER_SCRIM }} />
          <div className="flex items-center gap-3.5 p-4 sm:p-6">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              aria-label="Revenir au menu"
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/20 bg-zinc-950/70 text-white transition-colors hover:border-bmc-gold hover:text-bmc-gold focus-visible:outline-2 focus-visible:outline-bmc-gold disabled:opacity-50"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Finaliser la <span className="text-bmc-gold">commande</span>
              </h1>
              <p className="text-sm text-zinc-300">Wave, Orange Money ou espèces</p>
            </div>
          </div>
        </header>

        {isOrderBlocked && (
          <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-bmc-gold/35 bg-bmc-gold/10 px-4 py-3.5 text-sm text-zinc-200">
            <Clock className="mt-0.5 size-5 shrink-0 text-bmc-gold" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-white">
                {opening.isPaused
                  ? 'Commandes en pause pour le moment.'
                  : 'BMC est fermé pour le moment, la commande ne peut pas être envoyée.'}
              </p>
              <p>
                {opening.closedMessage ??
                  (opening.isPaused
                    ? 'La cuisine suspend temporairement la prise de commandes. Merci de réessayer dans quelques minutes.'
                    : `Réouverture ${opening.reopensLabel} (${OPENING_HOURS_LABEL}).`)}{' '}
                Votre panier et vos coordonnées sont gardés.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-red-500/40 bg-red-950/60 px-4 py-3.5 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-400" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-red-100">{error.message}</p>
              {error.itemErrors.map((message) => (
                <p key={message} className="text-xs text-red-300">
                  {message}
                </p>
              ))}
            </div>
          </div>
        )}

        <form id={formId} onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:items-start" noValidate>
          {/* ===== Colonne gauche : mode, coordonnées ===== */}
          <div className="space-y-5 lg:col-span-3">
            <div role="radiogroup" aria-label="Mode de réception" className="grid grid-cols-2 gap-3">
              {MODES.map(({ value, label, hint, Icon }) => {
                const active = mode === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isSubmitting}
                    onClick={() => changeMode(value)}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors disabled:opacity-60 ${
                      active ? 'border-bmc-gold bg-bmc-gold/10' : 'border-white/10 bg-zinc-900 hover:border-white/25'
                    }`}
                  >
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                        active ? 'bg-bmc-gold text-black' : 'bg-white/5 text-zinc-300'
                      }`}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-base font-bold text-white">{label}</span>
                      <span className="block truncate text-xs text-zinc-400">{hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <section className={card} aria-labelledby={`${formId}-contact`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id={`${formId}-contact`} className="font-display text-lg font-bold text-white">
                  {isPickup ? 'Vos coordonnées' : 'Livraison'}
                </h2>
                {clientUser && (
                  <span className="rounded-full bg-bmc-gold/15 px-2.5 py-0.5 text-xs font-semibold text-bmc-gold">Compte connecté</span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${formId}-name`} className={labelClass}>
                    Nom et prénom
                  </label>
                  <input
                    id={`${formId}-name`}
                    type="text"
                    autoComplete="name"
                    placeholder="Aminata Diallo"
                    value={form.customer_name}
                    onChange={(e) => update('customer_name', e.target.value)}
                    disabled={isSubmitting}
                    className={inputClass('customer_name')}
                  />
                  {fieldError('customer_name') && <span className="mt-1 block text-sm text-red-400">{fieldError('customer_name')}</span>}
                </div>

                <div>
                  <label htmlFor={`${formId}-phone`} className={labelClass}>
                    Téléphone
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="77 123 45 67"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    disabled={isSubmitting}
                    className={inputClass('phone')}
                  />
                  {fieldError('phone') && <span className="mt-1 block text-sm text-red-400">{fieldError('phone')}</span>}
                </div>

                {!isPickup && (
                  <>
                    <DeliveryZoneSelect
                      value={selectedAreaId}
                      onChange={handleAreaChange}
                      disabled={isSubmitting}
                      error={areaError ?? fieldError('delivery_area')}
                    />

                    <div>
                      <label htmlFor={`${formId}-address`} className={labelClass}>
                        Adresse ou repère
                      </label>
                      <input
                        id={`${formId}-address`}
                        type="text"
                        autoComplete="street-address"
                        placeholder="Rue, villa, point de repère"
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                        disabled={isSubmitting}
                        className={inputClass('address')}
                      />
                      {fieldError('address') && <span className="mt-1 block text-sm text-red-400">{fieldError('address')}</span>}
                      <div className="mt-1 flex flex-wrap items-center gap-x-4">
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isLocating || isSubmitting}
                          className="inline-flex h-10 cursor-pointer items-center gap-1.5 text-sm font-medium text-bmc-gold transition-colors hover:text-white disabled:opacity-50"
                        >
                          {isLocating ? (
                            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                          ) : locationSuccess ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : (
                            <LocateFixed className="size-4" aria-hidden="true" />
                          )}
                          {isLocating ? 'Recherche…' : locationSuccess ? 'Position ajoutée' : 'Utiliser ma position'}
                        </button>
                        {form.address.includes('maps.google.com') && (
                          <a
                            href={form.address.match(/https:\/\/maps\.google\.com\S+/)?.[0]?.replace(')', '') || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-zinc-300 underline underline-offset-4 transition-colors hover:text-white"
                          >
                            Vérifier
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">Mémorisée pour vos prochaines commandes. Modifiable à tout moment.</p>
                      {locationError && (
                        <p role="alert" className="mt-1 flex items-start gap-1.5 text-sm text-amber-300">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                          {locationError}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {isPickup && (
                <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm sm:grid-cols-2">
                  <p className="flex items-start gap-2.5 text-zinc-300">
                    <Store className="mt-0.5 size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-white">Retrait au restaurant</span>
                      {RESTAURANT_ADDRESS}
                    </span>
                  </p>
                  <p className="flex items-start gap-2.5 text-zinc-300">
                    <Clock className="mt-0.5 size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-white">Mardi – dimanche</span>
                      11h – 02h
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
                    <p className="text-zinc-400">Sans frais de livraison. Présentez votre référence de commande.</p>
                    <a
                      href={RESTAURANT_MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 font-medium text-bmc-gold transition-colors hover:text-white"
                    >
                      Itinéraire
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                <label
                  htmlFor={`${formId}-allergy`}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                    form.has_allergy
                      ? 'border-amber-400/60 bg-amber-500/10'
                      : 'border-white/10 bg-zinc-950 hover:border-white/25'
                  } ${isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    id={`${formId}-allergy`}
                    type="checkbox"
                    checked={form.has_allergy}
                    onChange={(e) => {
                      setForm((current) => ({ ...current, has_allergy: e.target.checked }))
                      if (error?.fieldErrors.has_allergy) clearError()
                    }}
                    disabled={isSubmitting}
                    className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-white/20 bg-zinc-900 accent-bmc-gold"
                  />
                  <span className="min-w-0 flex-1 text-sm leading-snug">
                    <span className="block font-semibold text-white">J&apos;ai une allergie</span>
                    <span className="mt-0.5 block text-xs text-zinc-300">
                      Précisez l&apos;allergène concerné dans la note ci-dessous (ex. arachide, œuf, sésame, lait).
                    </span>
                  </span>
                </label>
                {fieldError('has_allergy') && (
                  <span className="block text-sm text-red-400">{fieldError('has_allergy')}</span>
                )}

                <div>
                  <label htmlFor={`${formId}-notes`} className={labelClass}>
                    Note pour la cuisine{' '}
                    <span className={form.has_allergy ? 'font-semibold text-amber-300' : 'text-zinc-400'}>
                      {form.has_allergy ? '· Précisez votre allergie' : '(facultatif)'}
                    </span>
                  </label>
                  <textarea
                    id={`${formId}-notes`}
                    rows={2}
                    maxLength={500}
                    placeholder={
                      form.has_allergy
                        ? 'Ex. : Allergie à l’arachide — pas de sauce cacahuète ni traces.'
                        : 'Ex. : Sans oignon, peu pimenté, code d’entrée ou repère…'
                    }
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full resize-y rounded-lg border bg-zinc-950 px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 outline-none transition-colors sm:text-sm ${
                      fieldError('notes')
                        ? 'border-red-500'
                        : form.has_allergy && !form.notes.trim()
                          ? 'border-amber-400/60 focus:border-bmc-gold'
                          : 'border-white/10 focus:border-bmc-gold'
                    }`}
                  />
                  {fieldError('notes') && <span className="mt-1 block text-sm text-red-400">{fieldError('notes')}</span>}
                </div>
              </div>
            </section>
          </div>

          {/* ===== Colonne droite : paiement, récapitulatif ===== */}
          <div className="space-y-5 lg:col-span-2">
            <div className={card}>
              <PaymentSelector
                value={form.payment_method}
                onChange={(method: PaymentMethod) => update('payment_method', method)}
                disabled={isSubmitting}
              />
            </div>

            <section className={card} aria-labelledby={`${formId}-recap`}>
              <h2 id={`${formId}-recap`} className="mb-3 font-display text-lg font-bold text-white">
                Votre commande
              </h2>

              <ul className="mb-4 space-y-3">
                {visibleItems.map((item) => (
                  <li key={`${item.product.code}-${item.note ?? ''}`} className="flex items-center gap-3">
                    <img
                      src={getProductImageUrl(item.product) || item.product.image_url}
                      alt=""
                      width={44}
                      height={44}
                      loading="lazy"
                      className="size-11 shrink-0 rounded-lg bg-zinc-950 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {item.quantity} × {item.product.name}
                      </p>
                      {item.note && <p className="truncate text-xs text-zinc-400">{item.note}</p>}
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-200">
                      {formatFcfa(item.product.price * item.quantity)}
                    </p>
                  </li>
                ))}
                {hiddenItems > 0 && (
                  <li className="text-sm text-zinc-400">
                    + {hiddenItems} autre{hiddenItems > 1 ? 's' : ''} article{hiddenItems > 1 ? 's' : ''}
                  </li>
                )}
              </ul>

              <div className="border-t border-white/10 pt-4">
                <OrderTotals subtotal={subtotal} deliveryFee={deliveryFee} isPickup={isPickup} />
              </div>

              <div className="mt-4">
                <OrderSubmitButton
                  isSubmitting={isSubmitting}
                  amount={subtotal + (deliveryFee ?? 0)}
                  disabled={items.length === 0 || isOrderBlocked}
                  disabledLabel={
                    isOrderBlocked ? (opening.isPaused ? 'Commandes en pause' : 'Restaurant fermé') : undefined
                  }
                />
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  )
}
