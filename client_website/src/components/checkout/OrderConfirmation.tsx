import { Check, Phone } from 'lucide-react'
import { motion } from 'motion/react'
import { formatFcfa } from '../../lib/format'
import type { Order } from '../../types'

import type { Variants } from 'motion/react'

interface OrderConfirmationProps {
  order: Order
  deliveryAreaName?: string
  deliveryFee?: number | null
  /** Livraison chez le client (par défaut) ou retrait au restaurant. */
  fulfillment?: 'delivery' | 'pickup'
  onNewOrder: () => void
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
    },
  },
}

/**
 * Écran officiel de Confirmation de Commande BMC FOOD Dakar.
 * Reproduction textuelle et visuelle conforme à 100 % à la page 12 de la charte graphique
 * enrichie d'animations douces (« soft ») et d'un indicateur de suivi en direct.
 */
export function OrderConfirmation({
  order,
  deliveryAreaName,
  deliveryFee,
  fulfillment = 'delivery',
  onNewOrder,
}: OrderConfirmationProps) {
  const isPickup = fulfillment === 'pickup'
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
    <main className="relative min-h-dvh bg-zinc-950 text-white px-4 py-8 sm:py-12 flex flex-col justify-between overflow-hidden selection:bg-bmc-gold selection:text-black">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-sm flex-1 flex flex-col"
      >
        {/* 1. LOGO BMC FOOD OFFICIEL CENTRÉ (Page 12 de la charte) */}
        <motion.div variants={itemVariants} className="flex justify-center pt-2">
          <motion.img
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            src="/images/brand/logo.png"
            alt="BMC Food"
            width={140}
            height={56}
            className="h-14 w-auto object-contain filter brightness-110 drop-shadow-md"
          />
        </motion.div>

        {/* 2. BADGE ET TITRE « COMMANDE ENVOYÉE ! » */}
        <motion.div variants={itemVariants} className="mt-6 flex items-center justify-center gap-3.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-bmc-gold text-black">
            <Check className="size-6" aria-hidden="true" />
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight text-left">
            Commande<br />envoyée !
          </h1>
        </motion.div>

        {/* 3. SECTION RÉFÉRENCE (Page 12) */}
        <motion.div variants={itemVariants} className="mt-7 text-center">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            RÉFÉRENCE
          </p>
          <motion.p
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: 'spring', damping: 16 }}
            className="font-display text-3xl sm:text-4xl font-bold tracking-wider text-bmc-gold mt-1"
          >
            {order.order_ref}
          </motion.p>
        </motion.div>

        {/* 4. BARRE DE SUIVI HORIZONTALE EN 4 ÉTAPES AVEC PULSATION LIVE (Page 12) */}
        <motion.div variants={itemVariants} className="mt-7 px-3">
          <div className="relative flex items-center justify-between">
            {/* Ligne pointillée horizontale d'arrière-plan */}
            <div className="absolute left-3 right-3 top-2 h-[1px] border-t border-dashed border-zinc-700 -z-0" />

            {/* Étape 1 : Reçue (active / balise live pulsante) */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-4 rounded-full bg-bmc-gold ring-4 ring-zinc-950" />
              <span className="mt-2 text-xs font-semibold text-bmc-gold">Reçue</span>
            </div>

            {/* Étape 2 : En cuisine */}
            <div className="relative z-10 flex flex-col items-center opacity-70">
              <div className="size-3.5 rounded-full border-2 border-zinc-600 bg-zinc-900 ring-4 ring-zinc-950" />
              <span className="mt-2 text-xs font-medium text-zinc-400">En cuisine</span>
            </div>

            {/* Étape 3 : En route */}
            <div className="relative z-10 flex flex-col items-center opacity-70">
              <div className="size-3.5 rounded-full border-2 border-zinc-600 bg-zinc-900 ring-4 ring-zinc-950" />
              <span className="mt-2 text-xs font-medium text-zinc-400">{isPickup ? 'Prête' : 'En route'}</span>
            </div>

            {/* Étape 4 : Livrée */}
            <div className="relative z-10 flex flex-col items-center opacity-70">
              <div className="size-3.5 rounded-full border-2 border-zinc-600 bg-zinc-900 ring-4 ring-zinc-950" />
              <span className="mt-2 text-xs font-medium text-zinc-400">{isPickup ? 'Retirée' : 'Livrée'}</span>
            </div>
          </div>
        </motion.div>

        {/* 5. REÇU CLAIR ET DÉTAIL PAYÉ (Page 12) AVEC APPARITION EN CASCADE */}
        <motion.div
          variants={itemVariants}
          className="mt-8 rounded-2xl bg-zinc-900/85 border border-white/10 p-5 backdrop-blur-md shadow-xl relative"
        >
          {/* Lignes d'articles commandés */}
          <div className="space-y-3">
            {order.items.map((line, idx) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.06, duration: 0.3 }}
                className="flex items-center justify-between gap-3 text-sm text-zinc-200"
              >
                <span className="font-medium text-left">
                  {line.quantity} × {line.item_name}
                </span>
                <span className="font-display font-bold tabular-nums text-white shrink-0">
                  {formatDetailAmount(line.subtotal)}
                </span>
              </motion.div>
            ))}

            {/* Ligne livraison conforme à la charte (ex. Livraison · Liberté 5 : 1 500 F) */}
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + order.items.length * 0.06, duration: 0.3 }}
              className="flex items-center justify-between gap-3 text-sm text-zinc-300 pt-1 border-t border-white/5"
            >
              <span className="font-medium truncate text-left text-zinc-400">
                {isPickup ? `À emporter · ${order.address.replace(/^Retrait sur place – /, '')}` : `Livraison · ${deliveryAreaName || order.address || 'Dakar'}`}
              </span>
              <span className="font-display font-bold tabular-nums text-bmc-gold shrink-0">
                {isPickup ? 'Sans frais' : deliveryFee ? formatDetailAmount(deliveryFee) : 'Inclus'}
              </span>
            </motion.div>
          </div>

          {/* Séparateur fin */}
          <div className="my-5 border-t border-white/10" />

          {/* Total Payé */}
          <div className="text-center">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
              {paymentTitle}
            </p>
            <p className="font-display text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">
              {formatFcfa(order.total_amount)}
            </p>
          </div>
        </motion.div>

        {/* 6. BOUTONS D'ACTION (Page 12) AVEC MICRO-INTERACTIONS FLUIDES */}
        <motion.div variants={itemVariants} className="mt-8 space-y-3 pb-4">
          {/* Bouton 1 (Or BMC, texte charbon, JAMAIS blanc — Charte P. 12) */}
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="tel:+221778561313"
            className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-bmc-gold font-display text-base font-bold text-bmc-charcoal transition-all hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
          >
            <Phone className="size-4.5 stroke-[2.5] text-bmc-charcoal transition-transform group-hover:-rotate-12" />
            <span>Appeler BMC · 77 856 13 13</span>
          </motion.a>

          {/* Bouton 2 (Secondaire sombre, texte blanc — Charte P. 12) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onNewOrder}
            className="flex h-13 w-full items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 font-display text-base font-bold text-white transition-all hover:bg-zinc-800 hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold cursor-pointer"
          >
            Nouvelle commande
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  )
}
