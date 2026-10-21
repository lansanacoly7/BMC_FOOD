import { AlertTriangle, ArrowLeft, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { type FormEvent, useId, useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { useOrderSubmission } from '../../hooks/useOrderSubmission'
import { formatFcfa } from '../../lib/format'
import type { OrderCustomerDetails, OrderField } from '../../services/orders'
import type { PaymentMethod } from '../../types'
import { OrderSubmitButton } from './OrderSubmitButton'

// PROVISOIRE : sert à tester l'envoi de la commande (tâche 2 de Pape Aliou) en attendant le vrai checkout
// et l'écran de confirmation de Maimouna (GPS, validations, paiements). Il suffit de reprendre
// useOrderSubmission() et OrderSubmitButton dans son formulaire, puis de supprimer ce fichier.

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces à la livraison',
  wave: 'Wave',
  orange_money: 'Orange Money',
}

const EMPTY_FORM: OrderCustomerDetails = { customer_name: '', phone: '', address: '', notes: '', payment_method: 'cash' }

interface ProvisionalCheckoutProps {
  onBack: () => void
  onNewOrder: () => void
}

export function ProvisionalCheckout({ onBack, onNewOrder }: ProvisionalCheckoutProps) {
  const formId = useId()
  const { items, subtotal } = useCart()
  const { status, isSubmitting, order, error, submit, clearError, reset } = useOrderSubmission()
  // Le formulaire reste en mémoire ici : une erreur d'envoi n'efface jamais la saisie.
  const [form, setForm] = useState<OrderCustomerDetails>(EMPTY_FORM)

  const update = (field: OrderField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (error?.fieldErrors[field]) clearError()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit(form)
  }

  if (status === 'success' && order) {
    return (
      <section className="flex min-h-dvh flex-col items-center gap-5 bg-bmc-charcoal px-5 pb-8 pt-10 text-center text-white">
        <p className="font-display text-3xl font-extrabold">BMC Food</p>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-bmc-gold text-bmc-charcoal">
            <Check className="size-6" strokeWidth={3} aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-extrabold">Commande envoyée !</h1>
        </div>
        <div className="my-auto flex w-full max-w-sm flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Référence</p>
          <p className="font-display text-4xl font-extrabold text-bmc-gold">{order.order_ref}</p>
          <ul className="mt-2 flex flex-col gap-1.5 border-y border-white/15 py-3 text-sm">
            {order.items.map((line) => (
              <li key={line.id} className="flex justify-between gap-3 text-zinc-300">
                <span>
                  {line.quantity} × {line.item_name}
                </span>
                <span className="tabular-nums">{formatFcfa(line.subtotal)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Total · {PAYMENT_LABELS[order.payment_method]}
          </p>
          <p className="font-display text-3xl font-extrabold tabular-nums">{formatFcfa(order.total_amount)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            reset()
            onNewOrder()
          }}
          className="h-12 w-full max-w-sm rounded-2xl bg-white/10 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
        >
          Nouvelle commande
        </button>
      </section>
    )
  }

  const fieldError = (field: OrderField) => error?.fieldErrors[field]
  const inputClass = (field: OrderField) =>
    `mt-1 h-12 w-full rounded-xl border-[1.5px] bg-white px-3 focus:outline-none focus:ring-3 ${
      fieldError(field)
        ? 'border-red-700 focus:ring-red-700/20'
        : 'border-zinc-500 focus:border-bmc-orange-deep focus:ring-bmc-orange-deep/20'
    }`

  return (
    <section className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 pb-8 pt-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          aria-label="Revenir au menu"
          className="grid size-11 place-items-center rounded-full bg-zinc-100 focus-visible:outline-2 focus-visible:outline-bmc-orange-deep disabled:opacity-50"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-extrabold">Finaliser la commande</h1>
          <p className="text-xs text-zinc-500">Formulaire provisoire · le vrai checkout est la tâche de Maimouna</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{error.message}</p>
            {error.itemErrors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        </div>
      )}

      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {(
          [
            ['customer_name', 'Nom et prénom', 'name', 'text'],
            ['phone', 'Téléphone', 'tel', 'tel'],
            ['address', 'Adresse et point de repère', 'street-address', 'text'],
          ] as const
        ).map(([field, label, autoComplete, type]) => (
          <label key={field} className="block text-sm font-semibold">
            {label}
            <input
              type={type}
              autoComplete={autoComplete}
              value={form[field]}
              onChange={(event) => update(field, event.target.value)}
              disabled={isSubmitting}
              aria-invalid={fieldError(field) ? true : undefined}
              className={inputClass(field)}
            />
            {fieldError(field) && <span className="mt-1 block text-xs font-semibold text-red-700">{fieldError(field)}</span>}
          </label>
        ))}

        <fieldset disabled={isSubmitting} className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Paiement</legend>
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
            <label
              key={method}
              className={`flex h-12 cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-3 text-sm ${
                form.payment_method === method ? 'border-bmc-charcoal' : 'border-zinc-300'
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                checked={form.payment_method === method}
                onChange={() => update('payment_method', method)}
                className="accent-bmc-charcoal"
              />
              {PAYMENT_LABELS[method]}
            </label>
          ))}
        </fieldset>

        <div className="flex items-baseline justify-between rounded-2xl bg-zinc-100 px-4 py-3">
          <span className="font-semibold">Total des plats</span>
          <span className="font-display text-xl font-extrabold tabular-nums">{formatFcfa(subtotal)}</span>
        </div>

        <motion.div layout>
          <OrderSubmitButton isSubmitting={isSubmitting} amount={subtotal} disabled={items.length === 0} />
        </motion.div>
      </form>
    </section>
  )
}
