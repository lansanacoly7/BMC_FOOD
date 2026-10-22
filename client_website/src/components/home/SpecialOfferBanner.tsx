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
      className="relative w-full overflow-hidden my-4 sm:my-8"
    >
      <div className="w-full px-2 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          onClick={handleAction}
          className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 shadow-2xl bg-zinc-950 group cursor-pointer transition-all duration-300 hover:border-amber-400/60 hover:shadow-amber-500/15"
        >
          {/* 1. Visuel Officiel Google Flow (Ratio 16:9 haute définition) */}
          <img
            src="/images/products/special-offer-banner.jpg"
            alt="Offre Spéciale -20% sur votre première commande BMC Food"
            width={1024}
            height={571}
            className="w-full h-auto object-cover block transition-transform duration-700 ease-out group-hover:scale-[1.015]"
            loading="lazy"
          />

          {/* 2. Bouton interactif Or BMC posé au-dessus de l'image, en bas du texte */}
          <div className="absolute left-[5.5%] bottom-[7.5%] sm:bottom-[10%] md:bottom-[12%] lg:bottom-[13.5%] z-10">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                handleAction()
              }}
              aria-label="Commander maintenant et profiter de l'offre spéciale -20%"
              className="group/btn inline-flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-3.5 py-1.5 xs:px-4 xs:py-2 sm:px-6 sm:py-3 md:px-8 md:py-3.5 text-[10px] xs:text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-black shadow-xl shadow-amber-500/35 hover:brightness-110 hover:shadow-amber-500/60 cursor-pointer transition-all whitespace-nowrap"
            >
              <span>Commander</span>
              <span className="hidden xs:inline">Maintenant</span>
              <ArrowRight className="size-3 sm:size-4 md:size-4.5 stroke-[3] transition-transform duration-300 group-hover/btn:translate-x-1" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
