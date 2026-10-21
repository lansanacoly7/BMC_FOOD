import { BellRing } from 'lucide-react'
import { motion } from 'motion/react'
import { useId } from 'react'

interface AlertActivationPromptProps {
  onActivate: () => void
}

/**
 * Écran d'ouverture de l'admin. Les navigateurs bloquent le son et les demandes de notification
 * tant que l'utilisateur n'a pas cliqué : ce clic de début de service débloque les deux.
 */
export function AlertActivationPrompt({ onActivate }: AlertActivationPromptProps) {
  const titleId = useId()

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bmc-charcoal/95 p-6 backdrop-blur-sm">
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl bg-zinc-900 p-8 text-center ring-1 ring-white/10"
      >
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-bmc-gold/15 text-bmc-gold">
          <BellRing className="size-10" aria-hidden="true" />
        </div>
        <h1 id={titleId} className="mt-6 font-display text-3xl font-extrabold">
          Démarrer le service
        </h1>
        <p className="mt-3 text-zinc-400">
          Activez la sonnerie et les notifications pour ne manquer aucune nouvelle commande. Gardez cet onglet ouvert
          pendant tout le service.
        </p>
        <motion.button
          type="button"
          autoFocus
          whileTap={{ scale: 0.97 }}
          onClick={onActivate}
          className="mt-8 h-14 w-full rounded-2xl bg-bmc-orange font-display text-lg font-bold text-bmc-charcoal transition-colors hover:bg-bmc-gold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-bmc-offwhite"
        >
          Activer les alertes
        </motion.button>
      </motion.section>
    </div>
  )
}
