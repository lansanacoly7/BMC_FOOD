import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { formatFcfa } from '../../lib/format'
import type { Order } from '../../types'

interface OrderConfirmationProps {
  order: Order
  deliveryAreaName?: string
  deliveryFee?: number | null
  onNewOrder: () => void
}

/**
 * Écran officiel de Confirmation de Commande BMC FOOD Dakar.
 * Reproduction textuelle et visuelle conforme à 100 % à la page 12 de la charte graphique :
 * - Logo officiel centré en haut
 * - Badge rond or avec coche noire + Titre « Commande envoyée ! »
 * - Bloc RÉFÉRENCE avec numéro officiel en grand or (ex. BMC-4821)
 * - Suivi horizontal en 4 étapes : Reçue → En cuisine → En route → Livrée
 * - Reçu clair détaillant les articles et la livraison
 * - Total payé selon le moyen choisi (Wave, Orange Money ou Espèces)
 * - Bouton d'appel officiel « Appeler BMC · 77 856 13 13 » (or, texte charbon)
 * - Bouton « Nouvelle commande »
 */
export function OrderConfirmation({
  order,
  deliveryAreaName,
  deliveryFee,
  onNewOrder,
}: OrderConfirmationProps) {
  // Détermine le libellé du total payé selon le moyen choisi
  const paymentTitle =
    order.payment_method === 'wave'
      ? 'TOTAL PAYÉ · WAVE'
      : order.payment_method === 'orange_money'
        ? 'TOTAL PAYÉ · ORANGE MONEY'
        : 'TOTAL À PAYER · ESPÈCES'

  // Formate un montant en retirant « CFA » pour le détail (ex. « 3 500 F »)
  const formatDetailAmount = (val: number) => `${new Intl.NumberFormat('fr-FR').format(val)} F`

  return (
    <main className="min-h-dvh bg-bmc-black text-white px-4 py-8 sm:py-12 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-sm flex-1 flex flex-col">
        {/* 1. LOGO BMC FOOD OFFICIEL CENTRÉ (Page 12 de la charte) */}
        <div className="flex justify-center pt-2">
          <img
            src="/images/brand/logo.png"
            alt="BMC Food"
            width={140}
            height={56}
            className="h-14 w-auto object-contain"
          />
        </div>

        {/* 2. BADGE ET TITRE « COMMANDE ENVOYÉE ! » */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-6 flex items-center justify-center gap-3"
        >
          <div className="grid size-10 place-items-center rounded-full bg-bmc-gold text-bmc-charcoal shadow-md shadow-bmc-gold/20 shrink-0">
            <Check className="size-6" strokeWidth={3.5} aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Commande<br />envoyée !
          </h1>
        </motion.div>

        {/* 3. SECTION RÉFÉRENCE (Page 12) */}
        <div className="mt-7 text-center">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            RÉFÉRENCE
          </p>
          <p className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider text-bmc-gold mt-1">
            {order.order_ref}
          </p>
        </div>

        {/* 4. BARRE DE SUIVI HORIZONTALE EN 4 ÉTAPES (Page 12) */}
        <div className="mt-7 px-3">
          <div className="relative flex items-center justify-between">
            {/* Ligne pointillée horizontale d'arrière-plan */}
            <div className="absolute left-3 right-3 top-2 h-[1px] border-t border-dashed border-zinc-600 -z-0" />

            {/* Étape 1 : Reçue (active / pleine) */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-4 rounded-full bg-bmc-gold ring-4 ring-bmc-black shadow-xs shadow-bmc-gold" />
              <span className="mt-2 text-[11px] font-bold text-white">Reçue</span>
            </div>

            {/* Étape 2 : En cuisine */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-3.5 rounded-full border-2 border-zinc-500 bg-bmc-black ring-4 ring-bmc-black" />
              <span className="mt-2 text-[11px] font-medium text-zinc-400">En cuisine</span>
            </div>

            {/* Étape 3 : En route */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-3.5 rounded-full border-2 border-zinc-500 bg-bmc-black ring-4 ring-bmc-black" />
              <span className="mt-2 text-[11px] font-medium text-zinc-400">En route</span>
            </div>

            {/* Étape 4 : Livrée */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-3.5 rounded-full border-2 border-zinc-500 bg-bmc-black ring-4 ring-bmc-black" />
              <span className="mt-2 text-[11px] font-medium text-zinc-400">Livrée</span>
            </div>
          </div>
        </div>

        {/* 5. REÇU CLAIR ET DÉTAIL PAYÉ (Page 12) */}
        <div className="mt-8 rounded-2xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-xs">
          {/* Lignes d'articles commandés */}
          <div className="space-y-3">
            {order.items.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-3 text-sm text-zinc-200">
                <span className="font-medium text-left">
                  {line.quantity} × {line.item_name}
                </span>
                <span className="font-display font-bold tabular-nums text-white shrink-0">
                  {formatDetailAmount(line.subtotal)}
                </span>
              </div>
            ))}

            {/* Ligne livraison conforme à la charte (ex. Livraison · Liberté 5 : 1 500 F) */}
            <div className="flex items-center justify-between gap-3 text-sm text-zinc-300 pt-1">
              <span className="font-medium truncate text-left">
                Livraison · {deliveryAreaName || order.address || 'Dakar'}
              </span>
              <span className="font-display font-bold tabular-nums text-white shrink-0">
                {deliveryFee ? formatDetailAmount(deliveryFee) : 'Inclus'}
              </span>
            </div>
          </div>

          {/* Séparateur fin */}
          <div className="my-5 border-t border-white/10" />

          {/* Total Payé */}
          <div className="text-center">
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              {paymentTitle}
            </p>
            <p className="font-display text-3xl font-extrabold text-white mt-1 tabular-nums tracking-tight">
              {formatFcfa(order.total_amount)}
            </p>
          </div>
        </div>

        {/* 6. BOUTONS D'ACTION (Page 12) */}
        <div className="mt-8 space-y-3 pb-4">
          {/* Bouton 1 (Or BMC, texte charbon, JAMAIS blanc) */}
          <motion.a
            whileTap={{ scale: 0.98 }}
            href="tel:+221778561313"
            className="flex h-13 w-full items-center justify-center rounded-2xl bg-bmc-gold font-display text-base font-extrabold text-bmc-charcoal shadow-lg shadow-bmc-gold/25 transition-transform hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
          >
            Appeler BMC · 77 856 13 13
          </motion.a>

          {/* Bouton 2 (Secondaire sombre, texte blanc) */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onNewOrder}
            className="flex h-13 w-full items-center justify-center rounded-2xl bg-zinc-800/90 font-display text-base font-bold text-white transition-colors hover:bg-zinc-700/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold cursor-pointer"
          >
            Nouvelle commande
          </motion.button>
        </div>
      </div>
    </main>
  )
}
