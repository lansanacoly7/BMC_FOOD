import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

interface SpecialOfferBannerProps {
  onOrderNow?: () => void
}

/**
 * Bannière promotionnelle officielle Google Flow / BMC Food
 * Conforme aux directives de Maimouna Sall :
 * - Affiche le visuel officiel haute définition créé avec Google Flow
 * - Intègre le bouton interactif Or brossé superposé en bas du texte
 * - S'étend sur toute la largeur de l'écran avec bordure et lueur Dark Luxury
 * - Action au clic : défilement fluide vers la carte des spécialités
 */
export function SpecialOfferBanner({ onOrderNow }: SpecialOfferBannerProps) {
  const handleAction = () => {
    if (onOrderNow) {
      onOrderNow()
    } else {
      const target =
        document.getElementById('menu-catalog-grid') ||
        document.getElementById('menu-catalog-grid-desktop') ||
        document.getElementById('menu-section')
      target?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      aria-label="Offre spéciale première commande -20%"
      className="relative w-full overflow-hidden border-y border-amber-500/20 bg-black my-4 sm:my-8 group cursor-pointer"
      onClick={handleAction}
    >
      {/* 1. Visuel Officiel Panoramique Fin (Ratio 3.25:1 Pleine Largeur Écran) */}
      <img
        src="/images/products/special-offer-banner.jpg"
        alt="Offre Spéciale -20% sur votre première commande BMC Food"
        width={1920}
        height={590}
        className="w-full h-auto max-h-[220px] sm:max-h-[340px] md:max-h-[420px] lg:max-h-[480px] object-cover block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
        loading="lazy"
      />

      {/* 2. Bouton interactif Or BMC posé au-dessus de l'image, en bas du texte à gauche */}
      <div className="absolute left-[4%] sm:left-[5%] md:left-[6%] bottom-[8%] sm:bottom-[10%] md:bottom-[12%] z-10">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            handleAction()
          }}
          aria-label="Commander maintenant et profiter de l'offre spéciale -20%"
          className="group/btn inline-flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-3.5 py-1.5 xs:px-4 xs:py-2 sm:px-6 sm:py-2.5 md:px-7 md:py-3 text-[10px] xs:text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-xl shadow-amber-500/35 hover:brightness-110 hover:shadow-amber-500/60 cursor-pointer transition-all whitespace-nowrap"
        >
          <span>Commander</span>
          <span className="hidden xs:inline">Maintenant</span>
          <ArrowRight className="size-3 sm:size-3.5 md:size-4 stroke-[3] transition-transform duration-300 group-hover/btn:translate-x-1" />
        </motion.button>
      </div>
    </section>
  )
}
