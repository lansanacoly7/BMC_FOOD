import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

interface SpecialOfferBannerProps {
  onOrderNow?: () => void
  isVisible?: boolean
}

/**
 * Bannière promotionnelle officielle BMC Food
 * Conforme aux directives de Maimouna Sall :
 * - Image vierge avec festin à droite et coup de pinceau jaune à gauche
 * - Superposition dynamique en HTML/CSS : « Offre Spéciale », « -20% DE RÉDUCTION », condition et bouton
 * - Modifiable à 100% dans le code sans rééditer l'image
 * - Conditionnée dynamiquement via la prop isVisible
 */
export function SpecialOfferBanner({ onOrderNow, isVisible = true }: SpecialOfferBannerProps) {
  if (!isVisible) return null

  const handleAction = () => {
    if (onOrderNow) {
      onOrderNow()
    } else {
      const target =
        document.getElementById('special-offers-grid') ||
        document.getElementById('menu-catalog-grid') ||
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

      {/* 2. Cadre de la bannière avec image vierge et textes superposés dynamiques */}
      <div
        onClick={handleAction}
        className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/25 bg-black shadow-2xl shadow-black/80 group cursor-pointer transition-all duration-300 hover:border-amber-500/50 aspect-[16/9] sm:aspect-[21/9]"
      >
        {/* Visuel Vierge officiel généré par Maimouna Sall */}
        <img
          src="/images/products/special-offer-banner.jpg"
          alt="Bannière Offre Spéciale BMC Food"
          width={1024}
          height={434}
          className="size-full object-cover block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          loading="lazy"
        />

        {/* CONTENU SUPERPOSÉ EN HTML DYNAMIQUE */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-3.5 xs:p-4 sm:p-7 md:p-9 lg:p-11 pointer-events-none">
          {/* 1. Titre posé dans le coup de pinceau jaune */}
          <div className="w-[54%] sm:w-[50%] md:w-[48%] pt-0.5 sm:pt-2 md:pt-3">
            <span className="font-display text-xs xs:text-sm sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-black uppercase">
              Offre Spéciale
            </span>
          </div>

          {/* 2. Remise et condition */}
          <div className="w-[54%] sm:w-[50%] md:w-[48%] space-y-0.5 sm:space-y-1.5">
            <p className="font-display text-sm xs:text-base sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-none text-white">
              -20% <span className="text-bmc-gold">DE RÉDUCTION</span>
            </p>
            <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-zinc-200 leading-tight">
              Sur votre première commande
            </p>
          </div>

          {/* 3. Bouton interactif Or */}
          <div className="w-[54%] sm:w-[50%] md:w-[48%] pb-0.5 sm:pb-1">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.stopPropagation()
                handleAction()
              }}
              aria-label="Commander maintenant et profiter de l'offre spéciale -20%"
              className="pointer-events-auto inline-flex items-center justify-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-3 py-1.5 xs:px-4 xs:py-2 sm:px-6 sm:py-3 font-display text-[10px] xs:text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-black/60 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap"
            >
              <span>Commander Maintenant</span>
              <ArrowRight className="size-3 sm:size-4 stroke-[3]" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
