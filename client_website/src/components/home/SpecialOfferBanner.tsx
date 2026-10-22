import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

interface SpecialOfferBannerProps {
  onOrderNow?: () => void
}

/**
 * Bannière promotionnelle officielle BMC Food
 * Conforme aux directives de Maimouna Sall :
 * - Titre de section officiel « Nos Offres » en Dark Luxury avant la bannière
 * - Conteneur aligné avec le reste de la page (max-w-7xl) pour une parfaite stabilité au zoom/dézoom
 * - Bords arrondis élégants (rounded-2xl sm:rounded-3xl) avec liseré doré
 * - Affiche le visuel officiel responsive (mobile 16:9 et ordi panoramique)
 * - Intègre le bouton interactif Or brossé imposant superposé en bas du texte
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
      aria-label="Nos Offres Spéciales BMC Food"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 my-6 sm:my-10 space-y-3 sm:space-y-4"
    >
      {/* 1. Titre de Section officiel « Nos Offres » */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1.5 pt-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-widest text-bmc-gold">
            <Sparkles className="size-3.5 text-amber-400" />
            <span>Offres & Promotions</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Nos Offres Spéciales
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
          Profitez de nos remises exclusives sur vos spécialités BMC Food préférées à Dakar.
        </p>
      </div>

      {/* 2. Cadre de la bannière contenu et protégé contre l'étirement au dézoom */}
      <div
        onClick={handleAction}
        className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/25 bg-black shadow-2xl shadow-black/80 group cursor-pointer transition-all duration-300 hover:border-amber-500/50"
      >
        {/* Visuel Responsive (Mobile 16:9 / Ordi panoramique) */}
        <picture>
          <source media="(max-width: 640px)" srcSet="/images/products/special-offer-banner-mobile.jpg" />
          <img
            src="/images/products/special-offer-banner-desktop.jpg"
            alt="Offre Spéciale -20% sur votre première commande BMC Food"
            width={1024}
            height={434}
            className="w-full h-auto max-h-[280px] sm:max-h-[380px] md:max-h-[460px] lg:max-h-[520px] object-cover block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
            loading="lazy"
          />
        </picture>

        {/* Bouton interactif Or BMC posé au-dessus de l'image, en bas du texte à gauche */}
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
      </div>
    </section>
  )
}
