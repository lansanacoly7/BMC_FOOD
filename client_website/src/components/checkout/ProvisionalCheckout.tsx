import { AlertTriangle, ArrowLeft, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { type FormEvent, useId, useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { useOrderSubmission } from '../../hooks/useOrderSubmission'
import { formatFcfa } from '../../lib/format'
import { PAYMENT_METHOD_LABELS } from '../../lib/payments'
import type { OrderCustomerDetails, OrderField } from '../../services/orders'
import type { PaymentMethod } from '../../types'
import { DeliveryZoneSelect } from './DeliveryZoneSelect'
import { OrangeMoneyModal } from './OrangeMoneyModal'
import { OrderSubmitButton } from './OrderSubmitButton'
import { PaymentSelector } from './PaymentSelector'
import { WavePaymentModal } from './WavePaymentModal'

const EMPTY_FORM: OrderCustomerDetails = { customer_name: '', phone: '', address: '', notes: '', payment_method: 'cash' }

interface ProvisionalCheckoutProps {
  onBack: () => void
  onNewOrder: () => void
}

export function ProvisionalCheckout({ onBack, onNewOrder }: ProvisionalCheckoutProps) {
  const formId = useId()
  const { items, subtotal } = useCart()
  const { status, isSubmitting, order, error, submit, clearError, reset } = useOrderSubmission()
  const [form, setForm] = useState<OrderCustomerDetails>(EMPTY_FORM)
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(true)
  const [isOmModalOpen, setIsOmModalOpen] = useState(true)
  const [paymentDone, setPaymentDone] = useState(false)

  const update = (field: OrderField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (error?.fieldErrors[field]) clearError()
  }

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId)
    // Pré-remplit ou complète l'adresse avec le nom du quartier
    if (!form.address || form.address.trim() === '') {
      update('address', areaId.replace(/-/g, ' '))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setIsWaveModalOpen(true)
    setIsOmModalOpen(true)
    setPaymentDone(false)
    void submit(form)
  }

  // Écran de confirmation après soumission
  if (status === 'success' && order) {
    const isWave = order.payment_method === 'wave'
    const isOm = order.payment_method === 'orange_money'

    return (
      <>
        {/* Simulation Wave en superposition si Wave a été choisi et pas encore validé */}
        {isWave && (
          <WavePaymentModal
            isOpen={isWaveModalOpen}
            amount={order.total_amount}
            orderRef={order.order_ref}
            onClose={() => setIsWaveModalOpen(false)}
            onConfirm={() => {
              setIsWaveModalOpen(false)
              setPaymentDone(true)
            }}
          />
        )}

        {/* Simulation Orange Money en superposition si Orange Money a été choisi */}
        {isOm && (
          <OrangeMoneyModal
            isOpen={isOmModalOpen}
            amount={order.total_amount}
            orderRef={order.order_ref}
            onClose={() => setIsOmModalOpen(false)}
            onConfirm={() => {
              setIsOmModalOpen(false)
              setPaymentDone(true)
            }}
          />
        )}

        <section className="flex min-h-dvh flex-col items-center gap-5 bg-bmc-charcoal px-5 pb-8 pt-10 text-center text-white">
          <p className="font-display text-3xl font-extrabold text-white">BMC Food</p>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-bmc-gold text-bmc-charcoal">
              <Check className="size-6" strokeWidth={3} aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">
              {paymentDone ? 'Paiement confirmé & Commande transmise !' : 'Commande enregistrée !'}
            </h1>
          </div>

          <div className="my-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-zinc-900/60 p-4 border border-white/10">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Référence de commande</p>
            <p className="font-display text-4xl font-extrabold text-bmc-gold">{order.order_ref}</p>
            <ul className="mt-2 flex flex-col gap-1.5 border-y border-white/15 py-3 text-sm text-left">
              {order.items.map((line) => (
                <li key={line.id} className="flex justify-between gap-3 text-zinc-300">
                  <span>
                    {line.quantity} × {line.item_name}
                  </span>
                  <span className="tabular-nums font-semibold">{formatFcfa(line.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Total · {PAYMENT_METHOD_LABELS[order.payment_method]}
            </p>
            <p className="font-display text-3xl font-extrabold tabular-nums text-white">
              {formatFcfa(order.total_amount)}
            </p>

            {isWave && !paymentDone && (
              <button
                type="button"
                onClick={() => setIsWaveModalOpen(true)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-wave px-4 py-2.5 font-bold text-white shadow-md"
              >
                Ouvrir la simulation Wave ({formatFcfa(order.total_amount)})
              </button>
            )}

            {isOm && !paymentDone && (
              <button
                type="button"
                onClick={() => setIsOmModalOpen(true)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-orange-money px-4 py-2.5 font-bold text-black shadow-md"
              >
                Ouvrir la simulation Orange Money ({formatFcfa(order.total_amount)})
              </button>
            )}
          </div>

          <div className="w-full max-w-sm space-y-3">
            <p className="text-xs text-zinc-400">
              Cuisine prévenue · Assistance : <a href="tel:+221778561313" className="text-bmc-gold underline">77 856 13 13</a>
            </p>
            <button
              type="button"
              onClick={() => {
                reset()
                onNewOrder()
              }}
              className="h-12 w-full rounded-2xl bg-white/10 font-semibold text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold cursor-pointer"
            >
              Passer une autre commande
            </button>
          </div>
        </section>
      </>
    )
  }

  const fieldError = (field: OrderField) => error?.fieldErrors[field]
  const inputClass = (field: OrderField) =>
    `mt-1 h-12 w-full rounded-xl border-[1.5px] bg-white px-3 focus:outline-none focus:ring-3 ${
      fieldError(field)
        ? 'border-red-700 focus:ring-red-700/20'
        : 'border-zinc-300 focus:border-bmc-orange-deep focus:ring-bmc-orange-deep/20'
    }`

  return (
    <section className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 pb-12 pt-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          aria-label="Revenir au menu"
          className="grid size-11 place-items-center rounded-full bg-zinc-100 focus-visible:outline-2 focus-visible:outline-bmc-orange-deep disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-zinc-900">Finaliser la commande</h1>
          <p className="text-xs text-zinc-500">Paiement Wave, Orange Money & Espèces</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 border border-red-200">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{error.message}</p>
            {error.itemErrors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        </div>
      )}

      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* Coordonnées client */}
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-xs border border-zinc-200/80">
          <h2 className="font-display text-base font-bold text-zinc-900">Vos coordonnées</h2>

          <label className="block text-sm font-semibold text-zinc-800">
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
              <span className="mt-1 block text-xs font-semibold text-red-700">{fieldError('customer_name')}</span>
            )}
          </label>

          <label className="block text-sm font-semibold text-zinc-800">
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
              <span className="mt-1 block text-xs font-semibold text-red-700">{fieldError('phone')}</span>
            )}
          </label>

          {/* Sélecteur de quartier de Dakar */}
          <DeliveryZoneSelect
            value={selectedAreaId}
            onChange={handleAreaChange}
            disabled={isSubmitting}
          />

          <label className="block text-sm font-semibold text-zinc-800">
            Adresse exacte ou point de repère
            <input
              type="text"
              autoComplete="street-address"
              placeholder="Ex. Rue 14 x Boulevard de la République"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              disabled={isSubmitting}
              className={inputClass('address')}
            />
            {fieldError('address') && (
              <span className="mt-1 block text-xs font-semibold text-red-700">{fieldError('address')}</span>
            )}
          </label>
        </div>

        {/* Choix du moyen de paiement */}
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-zinc-200/80">
          <PaymentSelector
            value={form.payment_method}
            onChange={(method: PaymentMethod) => update('payment_method', method)}
            disabled={isSubmitting}
          />
        </div>

        {/* Récapitulatif total */}
        <div className="flex items-baseline justify-between rounded-2xl bg-zinc-100 px-5 py-4">
          <span className="font-semibold text-zinc-800">Total à payer</span>
          <span className="font-display text-2xl font-extrabold tabular-nums text-zinc-950">
            {formatFcfa(subtotal)}
          </span>
        </div>

        <motion.div layout>
          <OrderSubmitButton isSubmitting={isSubmitting} amount={subtotal} disabled={items.length === 0} />
        </motion.div>
      </form>
    </section>
  )
}
