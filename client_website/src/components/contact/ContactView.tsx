import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowUpRight, ChevronDown, Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { DELIVERY_ZONES, type DeliveryZone, findDeliveryArea } from '../../lib/delivery'
import { Select } from '../ui/Select'

interface ContactViewProps {
  onExploreMenu?: () => void
}

interface FormData {
  fullName: string
  phone: string
  subject: string
  message: string
}

interface FormErrors {
  fullName?: string
  phone?: string
  message?: string
}

const WHATSAPP_NUMBER = '221778561313'
const ADDRESS = 'PGXV+6R7, Dakar'
const MAPS_URL = 'https://maps.google.com/?q=PGXV%2B6R7,+Dakar'

const SUBJECT_OPTIONS = [
  { value: 'info', label: 'Renseignement sur la carte' },
  { value: 'group', label: 'Commande de groupe ou événement' },
  { value: 'order_followup', label: 'Suivi de commande ou réclamation' },
  { value: 'partnership', label: 'Partenariat' },
  { value: 'other', label: 'Autre question' },
]

/** Jours dans l'ordre d'affichage (index = Date.getDay()). Le lundi est fermé. */
const WEEK = [
  { day: 1, label: 'Lun', open: false },
  { day: 2, label: 'Mar', open: true },
  { day: 3, label: 'Mer', open: true },
  { day: 4, label: 'Jeu', open: true },
  { day: 5, label: 'Ven', open: true },
  { day: 6, label: 'Sam', open: true },
  { day: 0, label: 'Dim', open: true },
]

/** Un quartier par ligne dans le sélecteur : même grille de tarifs que la page de commande (lib/delivery.ts). */
const NEIGHBORHOODS = DELIVERY_ZONES.flatMap((zone) => zone.areas.map((area) => ({ area, zoneLabel: zone.label })))

/** Tarif d'une zone pour l'affichage compact : un prix, une fourchette, ou « sur appel ». */
function zoneFeeLabel(zone: DeliveryZone): string {
  const fees = zone.areas.map((area) => area.fee).filter((fee): fee is number => fee !== null)
  if (fees.length === 0) return 'Sur appel'
  const min = Math.min(...fees)
  const max = Math.max(...fees)
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
}

/** Couleur de la pastille d'une zone : proche, intermédiaire, éloignée. */
function zoneDot(zone: DeliveryZone): string {
  const fees = zone.areas.map((area) => area.fee).filter((fee): fee is number => fee !== null)
  const min = fees.length > 0 ? Math.min(...fees) : Infinity
  return min <= 1000 ? 'bg-bmc-success' : min <= 2000 ? 'bg-bmc-gold' : 'bg-bmc-orange-braise'
}
const FAQ_ITEMS = [
  {
    q: 'Combien de temps pour être livré ?',
    a: 'Entre 20 et 45 minutes selon votre quartier. Choisissez le vôtre dans la section Livraison pour voir le tarif.',
  },
  { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Wave, Orange Money et espèces.' },
  {
    q: 'Comment passer une commande de groupe ?',
    a: 'Écrivez-nous sur WhatsApp au 77 856 13 13 ou utilisez le formulaire en choisissant « Commande de groupe ». Indiquez la date et le nombre de personnes.',
  },
  {
    q: 'Mon quartier n’est pas dans la liste.',
    a: 'Appelez-nous au 77 856 13 13, nous vous dirons si nous pouvons vous livrer.',
  },
]

const formatPrice = (value: number) => `${value.toLocaleString('fr-FR')} F`

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-zinc-950 px-3.5 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors ${
    hasError ? 'border-bmc-error' : 'border-white/15 focus:border-bmc-gold'
  }`

/** Voile du hero : teinte du fond de page à une opacité donnée, en paliers progressifs (aucune coupure nette). */
const page = (opacity: number) => `color-mix(in oklab, var(--color-zinc-950) ${opacity}%, transparent)`
const HERO_SCRIM = `linear-gradient(to right, ${page(96)} 0%, ${page(88)} 30%, ${page(66)} 52%, ${page(36)} 72%, ${page(12)} 88%, transparent 100%)`

/** Jour de service : après minuit (avant 2h), on appartient encore au service de la veille. */
function serviceDayOf(date: Date): number {
  const day = date.getDay()
  return date.getHours() < 2 ? (day + 6) % 7 : day
}

/** Ouvert du mardi au dimanche, 11h – 02h. */
function isOpenAt(date: Date): boolean {
  const hour = date.getHours()
  if (hour >= 2 && hour < 11) return false
  return serviceDayOf(date) !== 1
}

function SectionTitle({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="mb-4 flex items-center gap-3 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
      <span aria-hidden="true" className="h-5 w-1 rounded-full bg-bmc-gold" />
      {children}
    </h2>
  )
}

const cardClass = 'warm-card rounded-2xl border bg-zinc-900'

/** Fondu de la photo vers la couleur de la carte, en paliers progressifs. */
const card = (opacity: number) => `color-mix(in oklab, var(--color-zinc-900) ${opacity}%, transparent)`
const CARD_FADE = `linear-gradient(to top, ${card(100)} 0%, ${card(82)} 24%, ${card(46)} 52%, ${card(12)} 80%, transparent 100%)`

/** Bandeau photo en tête d'une carte. */
function CardPhoto({ src, label, className = '' }: { src: string; label?: string; className?: string }) {
  return (
    <div className={`relative h-28 overflow-hidden sm:h-32 ${className}`}>
      <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: CARD_FADE }} />
      {label && <p className="absolute bottom-3 left-5 font-display text-lg font-bold text-white">{label}</p>}
    </div>
  )
}

export function ContactView({ onExploreMenu }: ContactViewProps) {
  const [formData, setFormData] = useState<FormData>({ fullName: '', phone: '', subject: 'info', message: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [neighborhood, setNeighborhood] = useState('')

  const now = new Date()
  const isOpenNow = isOpenAt(now)
  const today = serviceDayOf(now)

  const neighborhoodOptions = useMemo(
    () =>
      NEIGHBORHOODS.map(({ area, zoneLabel }) => ({
        value: area.id,
        label: area.name,
        hint: `${zoneLabel} · ${area.fee === null ? 'prix sur appel' : formatPrice(area.fee)}`,
      })),
    [],
  )
  const selectedArea = neighborhood ? findDeliveryArea(neighborhood) : undefined

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (formData.fullName.trim().length < 3) next.fullName = 'Indiquez votre nom (3 caractères minimum).'
    if (!/^(?:\+221|00221)?(?:7[05678]|33)\d{7}$/.test(formData.phone.replace(/\s+/g, ''))) {
      next.phone = 'Numéro invalide (ex. 77 856 13 13).'
    }
    if (formData.message.trim().length < 10) next.message = 'Message trop court (10 caractères minimum).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const subjectLabel = SUBJECT_OPTIONS.find((o) => o.value === formData.subject)?.label ?? ''
    const text = [
      'Bonjour BMC Food,',
      `Objet : ${subjectLabel}`,
      formData.message.trim(),
      `${formData.fullName.trim()} – ${formData.phone.trim()}`,
    ].join('\n')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setWhatsappUrl(url)
  }

  const handleReset = () => {
    setFormData({ fullName: '', phone: '', subject: 'info', message: '' })
    setErrors({})
    setWhatsappUrl(null)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-5 sm:space-y-12 sm:px-6 sm:pt-8 lg:px-8">
      {/* ============ Petit héros ============ */}
      <header className="relative isolate flex min-h-[168px] items-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 sm:min-h-[200px]">
        <img
          src="/images/hero/tacos_mixte_pane_cut.webp"
          alt=""
          width={800}
          height={597}
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover object-[80%_center]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ backgroundImage: HERO_SCRIM }} />

        <div className="max-w-md space-y-3 p-5 sm:p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Nous <span className="text-bmc-gold">contacter</span>
          </h1>
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
            Une question, une commande de groupe, un souci de livraison : on vous répond.
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-200">
            <span className={`size-2 rounded-full ${isOpenNow ? 'bg-bmc-success' : 'bg-zinc-500'}`} />
            {isOpenNow ? 'Ouvert maintenant' : 'Fermé pour le moment'}
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">Mar – dim, 11h – 02h</span>
          </p>
        </div>
      </header>

      {/* ============ Nous joindre + horaires | carte ============ */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-10 lg:col-span-5">
          <section aria-labelledby="reach-title">
            <SectionTitle id="reach-title">Nous joindre</SectionTitle>
            <div className={`${cardClass} divide-y divide-white/10 overflow-hidden`}>
              <CardPhoto src="/images/hero/hero-banner-duo.jpg" label="On prend votre commande" />
              {[
                { number: '77 856 13 13', tel: '778561313', primary: true },
                { number: '77 106 75 75', tel: '771067575', primary: false },
              ].map((line) => (
                <div key={line.tel} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Phone className="size-5 shrink-0 text-bmc-gold" aria-hidden="true" />
                    <span className="font-display text-xl font-bold tabular-nums text-white">{line.number}</span>
                  </div>
                  <a
                    href={`tel:${line.tel}`}
                    className={`inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors ${
                      line.primary
                        ? 'bg-bmc-gold text-black hover:bg-amber-400'
                        : 'border border-white/20 text-white hover:border-white/40'
                    }`}
                  >
                    Appeler
                  </a>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="size-5 shrink-0 text-[#25D366]" aria-hidden="true" />
                  <span className="text-sm font-medium text-white">WhatsApp</span>
                </div>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:border-white/40"
                >
                  Écrire
                </a>
              </div>
            </div>
          </section>

          <section aria-labelledby="hours-title">
            <SectionTitle id="hours-title">Horaires</SectionTitle>
            <div className={`${cardClass} p-4`}>
              <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {WEEK.map((d) => {
                  const isToday = d.day === today
                  return (
                    <li
                      key={d.day}
                      aria-current={isToday ? 'date' : undefined}
                      className={`flex flex-col items-center rounded-lg border py-3 text-center ${
                        isToday ? 'border-bmc-gold bg-bmc-gold/10' : 'border-white/10'
                      }`}
                    >
                      <span className={`text-xs font-semibold ${isToday ? 'text-bmc-gold' : 'text-white'}`}>{d.label}</span>
                      {d.open ? (
                        <span className="mt-1.5 flex flex-col text-xs leading-snug tabular-nums text-zinc-200">
                          <span>11h</span>
                          <span className="text-zinc-500">02h</span>
                        </span>
                      ) : (
                        <span className="mt-1.5 text-xs text-zinc-500">Fermé</span>
                      )}
                    </li>
                  )
                })}
              </ol>
              <p className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                <Clock className="size-4 shrink-0 text-bmc-gold" aria-hidden="true" />
                Ouvert du mardi au dimanche, de 11h à 02h.
              </p>
            </div>
          </section>
        </div>

        <section aria-labelledby="map-title" className="lg:col-span-7">
          <SectionTitle id="map-title">Nous trouver</SectionTitle>
          <div className={`${cardClass} flex flex-col overflow-hidden`}>
            <div className="map-frame h-72 sm:h-96 lg:h-[26rem]">
              {/* Carte sombre en couleurs avec bords fondus (voir .map-themed et .map-frame dans index.css) */}
              <iframe
                title={`Emplacement de BMC Food, ${ADDRESS}`}
                src="https://www.openstreetmap.org/export/embed.html?bbox=-17.4654%2C14.7381%2C-17.4454%2C14.7581&amp;layer=mapnik&amp;marker=14.7481%2C-17.4554"
                className="map-themed size-full border-0"
                loading="lazy"
              />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 p-4">
              <p className="flex min-w-0 items-center gap-3">
                <MapPin className="size-5 shrink-0 text-bmc-gold" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs text-zinc-400">Adresse</span>
                  <span className="block truncate font-display text-base font-bold text-white">{ADDRESS}</span>
                </span>
              </p>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-4 text-sm font-medium text-white transition-colors hover:border-white/40"
              >
                Itinéraire
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ============ Livraison ============ */}
      <section aria-labelledby="delivery-title">
        <SectionTitle id="delivery-title">Livraison</SectionTitle>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
          {/* Sélecteur : tarif de votre quartier */}
          <div className={`${cardClass} overflow-hidden p-5 lg:col-span-2`}>
            <CardPhoto src="/images/products/burger-bmc-complet.webp" label="Livraison à Dakar" className="-mx-5 -mt-5 mb-5" />
            <label htmlFor="neighborhood" className="mb-2 block text-sm font-semibold text-white">
              Votre quartier
            </label>
            <Select
              id="neighborhood"
              value={neighborhood}
              onChange={setNeighborhood}
              options={neighborhoodOptions}
              placeholder="Choisir mon quartier"
            />

            <div className="mt-4 min-h-[104px] rounded-xl border border-white/10 bg-zinc-950 p-4" aria-live="polite">
              {selectedArea ? (
                selectedArea.fee === null ? (
                  <p className="text-sm leading-relaxed text-zinc-300">
                    Destination éloignée : appelez-nous au{' '}
                    <a href="tel:778561313" className="font-semibold text-bmc-gold underline underline-offset-4 transition-colors hover:text-white">
                      77 856 13 13
                    </a>{' '}
                    pour confirmer le tarif.
                  </p>
                ) : (
                  <div>
                    <p className="text-sm text-zinc-400">Livraison à {selectedArea.name}</p>
                    <p className="font-display text-3xl font-bold tabular-nums text-white">{formatPrice(selectedArea.fee)}</p>
                  </div>
                )
              ) : (
                <p className="text-sm leading-relaxed text-zinc-400">Choisissez votre quartier pour voir le tarif de livraison.</p>
              )}            </div>
          </div>

          {/* Grille complète des tarifs */}
          <div className={`${cardClass} p-5 lg:col-span-3`}>
            <h3 className="mb-1 text-sm font-semibold text-white">Toutes les zones</h3>
            <div className="divide-y divide-white/10">
              {DELIVERY_ZONES.map((zone) => (
                <div key={zone.zone} className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <div>
                    <p className="flex items-center gap-2 font-display text-base font-bold tabular-nums text-white">
                      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${zoneDot(zone)}`} />
                      {zoneFeeLabel(zone)}
                    </p>
                    <p className="mt-0.5 pl-[1.125rem] text-xs text-zinc-400">{zone.label}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-200">
                    {zone.areas.map((area) => (area.fee === null ? `${area.name} (sur appel)` : area.name)).join(', ')}
                  </p>
                </div>
              ))}
            </div>          </div>
        </div>
      </section>

      {/* ============ Formulaire | FAQ ============ */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
        <section aria-labelledby="form-title" className="lg:col-span-7">
          <SectionTitle id="form-title">Écrire à l’équipe</SectionTitle>
          <div className={`${cardClass} p-5 sm:p-6`}>
            <p className="mb-5 text-sm text-zinc-400">Votre message s’ouvre dans WhatsApp, prêt à être envoyé.</p>

            <AnimatePresence mode="wait" initial={false}>
              {whatsappUrl ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 rounded-xl border border-white/10 bg-zinc-950 p-5"
                >
                  <h3 className="font-display text-lg font-semibold text-white">
                    Merci, {formData.fullName.trim().split(' ')[0]}.
                  </h3>
                  <p className="text-sm text-zinc-300">
                    Votre message est prêt dans WhatsApp. Il n’est envoyé qu’une fois que vous appuyez sur « Envoyer » dans l’application.
                  </p>
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-lg bg-bmc-gold px-4 text-sm font-semibold text-black hover:bg-amber-400"
                      >
                        Rouvrir WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex h-12 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border border-white/20 px-4 text-sm font-semibold text-white hover:border-white/40"
                      >
                        Nouveau message
                      </button>
                    </div>
                    {onExploreMenu && (
                      <button
                        type="button"
                        onClick={onExploreMenu}
                        className="inline-flex h-11 w-full cursor-pointer items-center justify-center text-sm font-medium text-zinc-300 underline underline-offset-4 hover:text-white"
                      >
                        Voir la carte
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="fullName" className="text-sm font-medium text-zinc-200">
                        Nom et prénom
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        value={formData.fullName}
                        onChange={(e) => {
                          setFormData({ ...formData, fullName: e.target.value })
                          if (errors.fullName) setErrors({ ...errors, fullName: undefined })
                        }}
                        aria-invalid={Boolean(errors.fullName)}
                        aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                        className={inputClass(Boolean(errors.fullName))}
                      />
                      {errors.fullName && (
                        <p id="fullName-error" className="flex items-center gap-1 text-sm text-red-400">
                          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-sm font-medium text-zinc-200">
                        Téléphone
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value })
                          if (errors.phone) setErrors({ ...errors, phone: undefined })
                        }}
                        placeholder="77 000 00 00"
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        className={inputClass(Boolean(errors.phone))}
                      />
                      {errors.phone && (
                        <p id="phone-error" className="flex items-center gap-1 text-sm text-red-400">
                          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="text-sm font-medium text-zinc-200">
                      Objet
                    </label>
                    <Select
                      id="subject"
                      value={formData.subject}
                      onChange={(value) => setFormData({ ...formData, subject: value })}
                      options={SUBJECT_OPTIONS}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-sm font-medium text-zinc-200">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value })
                        if (errors.message) setErrors({ ...errors, message: undefined })
                      }}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                      className={`${inputClass(Boolean(errors.message))} resize-none`}
                    />
                    {errors.message && (
                      <p id="message-error" className="flex items-center gap-1 text-sm text-red-400">
                        <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-bmc-gold text-base font-semibold text-black transition-colors hover:bg-amber-400 sm:w-auto sm:px-8"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Envoyer sur WhatsApp
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="lg:col-span-5">
          <SectionTitle id="faq-title">Questions fréquentes</SectionTitle>
          <div className={`${cardClass} divide-y divide-white/10 overflow-hidden px-5`}>
            <CardPhoto src="/images/products/chicken-wings-bbq.webp" label="Une question ?" className="-mx-5" />
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 py-3 text-left text-base font-medium text-white hover:text-bmc-gold"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && <p className="pb-4 text-sm leading-relaxed text-zinc-300">{item.a}</p>}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
