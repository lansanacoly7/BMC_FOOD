import { AlertTriangle, ArrowLeft, Check, LoaderCircle, MapPin, Navigation } from 'lucide-react'
import { motion } from 'motion/react'
import { type FormEvent, useId, useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { useOrderSubmission } from '../../hooks/useOrderSubmission'
import { findDeliveryArea } from '../../lib/delivery'
import type { OrderCustomerDetails, OrderField } from '../../services/orders'
import type { PaymentMethod } from '../../types'
import { DeliveryZoneSelect } from './DeliveryZoneSelect'
import { OrangeMoneyModal } from './OrangeMoneyModal'
import { OrderConfirmation } from './OrderConfirmation'
import { OrderSubmitButton } from './OrderSubmitButton'
import { OrderTotals } from './OrderTotals'
import { PaymentSelector } from './PaymentSelector'
import { WavePaymentModal } from './WavePaymentModal'

const EMPTY_FORM: OrderCustomerDetails = { customer_name: '', phone: '', address: '', notes: '', payment_method: 'cash' }

interface ProvisionalCheckoutProps {
  onBack: () => void
  onNewOrder: () => void
}

/**
 * Écran « Finaliser la commande » (Univers Dark Luxury).
 * Design 100% harmonisé avec le thème sombre, les contrastes dorés et les cartes Ardoise.
 */
export function ProvisionalCheckout({ onBack, onNewOrder }: ProvisionalCheckoutProps) {
  const formId = useId()
  const { items, subtotal } = useCart()
  const { status, isSubmitting, order, error, submit, clearError, reset } = useOrderSubmission()
  const [form, setForm] = useState<OrderCustomerDetails>(EMPTY_FORM)
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(true)
  const [isOmModalOpen, setIsOmModalOpen] = useState(true)
  const [isLocating, setIsLocating] = useState(false)
  const [locationSuccess, setLocationSuccess] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const selectedArea = selectedAreaId ? findDeliveryArea(selectedAreaId) : undefined

  const update = (field: OrderField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (error?.fieldErrors[field]) clearError()
  }

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId)
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
            { headers: { 'Accept-Language': 'fr' } }
          )
          if (response.ok) {
            const data = await response.json()
            const road = data.address?.road || data.address?.pedestrian || ''
            const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || ''
            const label = [road, suburb].filter(Boolean).join(', ')

            if (label) {
              update('address', `${label} (${googleMapsUrl})`)
            } else {
              update('address', `Position GPS : ${googleMapsUrl}`)
            }
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
          setLocationError('Autorisation refusée. Veuillez autoriser la localisation ou saisir votre adresse.')
        } else {
          setLocationError('Impossible de récupérer la position GPS. Saisissez votre adresse manuellement.')
        }
        setTimeout(() => setLocationError(null), 5000)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setIsWaveModalOpen(true)
    setIsOmModalOpen(true)
    void submit(form)
  }

  // Écran officiel de confirmation reproduisant fidèlement la page 12 de la charte graphique
  if (status === 'success' && order) {
    const isWave = order.payment_method === 'wave'
    const isOm = order.payment_method === 'orange_money'

    return (
      <>
        {/* Simulation Wave en superposition avant la confirmation si Wave choisi */}
        {isWave && (
          <WavePaymentModal
            isOpen={isWaveModalOpen}
            amount={order.total_amount}
            orderRef={order.order_ref}
            onClose={() => setIsWaveModalOpen(false)}
            onConfirm={() => setIsWaveModalOpen(false)}
          />
        )}

        {/* Simulation Orange Money en superposition si Orange Money choisi */}
        {isOm && (
          <OrangeMoneyModal
            isOpen={isOmModalOpen}
            amount={order.total_amount}
            orderRef={order.order_ref}
            onClose={() => setIsOmModalOpen(false)}
            onConfirm={() => setIsOmModalOpen(false)}
          />
        )}

        {/* Reproduction exacte de la page 12 de la charte graphique */}
        <OrderConfirmation
          order={order}
          deliveryAreaName={selectedArea?.name}
          deliveryFee={selectedArea?.fee}
          onNewOrder={() => {
            reset()
            onNewOrder()
          }}
        />
      </>
    )
  }

  const fieldError = (field: OrderField) => error?.fieldErrors[field]
  const inputClass = (field: OrderField) =>
    `mt-1.5 h-12 w-full rounded-xl border bg-zinc-950/90 px-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all ${
      fieldError(field)
        ? 'border-red-500 focus:ring-red-500/25'
        : 'border-white/15 focus:border-bmc-gold focus:ring-bmc-gold/25'
    }`

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 pb-16 pt-5 selection:bg-bmc-gold selection:text-black">
      <section className="mx-auto flex max-w-lg flex-col gap-6 px-4">
        {/* En-tête noir et or avec bouton retour contrasté */}
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            aria-label="Revenir au menu"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-zinc-900 border border-white/15 text-white hover:border-bmc-gold hover:text-bmc-gold transition-colors focus-visible:outline-2 focus-visible:outline-bmc-gold disabled:opacity-50 cursor-pointer shadow-md"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-black text-white">Finaliser la commande</h1>
            <p className="text-xs font-semibold text-zinc-400">Paiement Wave, Orange Money & Espèces</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex gap-3 rounded-2xl bg-red-950/80 px-4 py-3.5 text-sm text-red-200 border border-red-500/40 shadow-lg">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-400" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="font-bold text-red-100">{error.message}</p>
              {error.itemErrors.map((message) => (
                <p key={message} className="text-xs text-red-300">{message}</p>
              ))}
            </div>
          </div>
        )}

        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Card 1 : Coordonnées client */}
          <div className="space-y-4.5 rounded-2xl bg-zinc-900/90 p-5 shadow-xl border border-white/10 backdrop-blur-xs">
            <h2 className="font-display text-base font-extrabold text-white flex items-center gap-2">
              <MapPin className="size-4 text-bmc-gold" />
              Vos coordonnées de livraison
            </h2>

            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Nom et prénom
              <input
                type="text"
                autoComplete="name"
                placeholder="Ex. Aminata Diallo"
                value={form.customer_name}
                onChange={(e) => update('customer_name', e.target.value)}
                disabled={isSubmitting}
                className={inputClass('customer_name')}
              />
              {fieldError('customer_name') && (
                <span className="mt-1 block text-xs font-semibold text-red-400">{fieldError('customer_name')}</span>
              )}
            </label>

            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
              Téléphone sénégalais
              <input
                type="tel"
                autoComplete="tel"
                placeholder="Ex. 77 123 45 67"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                disabled={isSubmitting}
                className={inputClass('phone')}
              />
              {fieldError('phone') && (
                <span className="mt-1 block text-xs font-semibold text-red-400">{fieldError('phone')}</span>
              )}
            </label>

            {/* Sélecteur de quartier de Dakar */}
            <DeliveryZoneSelect
              value={selectedAreaId}
              onChange={handleAreaChange}
              disabled={isSubmitting}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="address-input" className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Adresse exacte ou point de repère
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating || isSubmitting}
                  aria-label="Prendre ma position sur Google Maps"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 hover:border-bmc-gold/50 px-2.5 py-1 text-[11px] font-bold text-bmc-gold hover:text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLocating ? (
                    <>
                      <LoaderCircle className="size-3.5 animate-spin text-bmc-gold" />
                      <span>Localisation…</span>
                    </>
                  ) : locationSuccess ? (
                    <>
                      <Check className="size-3.5 text-green-400 stroke-[3]" />
                      <span className="text-green-400">Position capturée !</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="size-3.5 text-bmc-gold" />
                      <span>📍 Ma position Maps</span>
                    </>
                  )}
                </button>
              </div>

              <input
                id="address-input"
                type="text"
                autoComplete="street-address"
                placeholder="Ex. Rue 14 x Boulevard de la République ou lien Maps"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                disabled={isSubmitting}
                className={inputClass('address')}
              />

              {locationError && (
                <p className="mt-1 text-xs text-amber-400/90 font-medium">{locationError}</p>
              )}

              {fieldError('address') && (
                <span className="mt-1 block text-xs font-semibold text-red-400">{fieldError('address')}</span>
              )}

              {form.address && form.address.includes('maps.google.com') && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Check className="size-3.5 text-bmc-gold shrink-0" />
                  <span>Position GPS Google Maps intégrée pour le livreur.</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2 : Choix du moyen de paiement */}
          <div className="rounded-2xl bg-zinc-900/90 p-5 shadow-xl border border-white/10 backdrop-blur-xs">
            <PaymentSelector
              value={form.payment_method}
              onChange={(method: PaymentMethod) => update('payment_method', method)}
              disabled={isSubmitting}
            />
          </div>

          {/* Card 3 : Récapitulatif montant total avec frais de livraison */}
          <OrderTotals subtotal={subtotal} deliveryFee={selectedArea?.fee} />

          {/* Card 4 : Bouton de confirmation */}
          <motion.div layout className="pt-1">
            <OrderSubmitButton
              isSubmitting={isSubmitting}
              amount={subtotal + (selectedArea?.fee ?? 0)}
              disabled={items.length === 0}
            />
          </motion.div>
        </form>
      </section>
    </div>
  )
}
