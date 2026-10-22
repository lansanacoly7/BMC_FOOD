import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

interface SpecialOfferBannerProps {
  onOrderNow?: () => void
}

/**
 * Bannière promotionnelle officielle BMC Food
 * Conforme aux directives de Maimouna Sall :
 * - Affiche le visuel officiel panoramique fin en pleine largeur d'écran (bord à bord)
 * - Intègre le bouton interactif Or brossé superposé en bas du texte
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
      {/* 1. Visuel Officiel Panoramique Ordinateur & Tablette (Ratio 2.36:1 Pleine Largeur Écran) */}
      <picture>
        <source media="(max-width: 640px)" srcSet="/images/products/special-offer-banner-mobile.jpg" />
        <img
          src="/images/products/special-offer-banner-desktop.jpg"
          alt="Offre Spéciale -20% sur votre première commande BMC Food"
          width={1024}
          height={434}
          className="w-full h-auto max-h-[260px] sm:max-h-[360px] md:max-h-[440px] lg:max-h-[500px] object-cover block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          loading="lazy"
        />
      </picture>

      {/* 2. Bouton interactif Or BMC posé au-dessus de l'image, en bas du texte à gauche (taille imposante alignée sur le Hero) */}
      <div className="absolute left-[4%] sm:left-[5%] md:left-[6%] bottom-[6%] sm:bottom-[8%] md:bottom-[10%] z-10">
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => {
            e.stopPropagation()
            handleAction()
          }}
          aria-label="Commander maintenant et profiter de l'offre spéciale -20%"
          className="group/btn inline-flex h-10 xs:h-12 sm:h-14 items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-4 xs:px-6 sm:px-8 md:px-10 font-display text-xs xs:text-sm sm:text-base font-black uppercase tracking-wider text-black shadow-xl shadow-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/60 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap"
        >
          <span>Commander</span>
          <span>Maintenant</span>
          <ArrowRight className="size-3.5 sm:size-4 md:size-5 stroke-[3] transition-transform duration-300 group-hover/btn:translate-x-1" />
        </motion.button>
      </div>
    </section>
  )
}
