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

      {/* 2. Cadre de la bannière avec image vierge (1024x571) et textes superposés dynamiques */}
      <div
        onClick={handleAction}
        className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/25 bg-black shadow-2xl shadow-black/80 group cursor-pointer transition-all duration-300 hover:border-amber-500/50 aspect-[1024/571]"
      >
        {/* Visuel Vierge officiel généré par Maimouna Sall (1024x571) */}
        <img
          src="/images/products/special-offer-banner.jpg"
          alt="Bannière Offre Spéciale BMC Food"
          width={1024}
          height={571}
          className="size-full object-cover block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          loading="lazy"
        />

        {/* CONTENU SUPERPOSÉ EN HTML DYNAMIQUE CONFORME À L'IMAGE DE RÉFÉRENCE */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* 1. Titre manuscrit « Offre Spéciale » agrandi pour occuper pleinement la tache de peinture jaune sur Mobile & Desktop */}
          <div className="absolute top-[21%] sm:top-[22%] -translate-y-1/2 left-[3%] xs:left-[3.5%] sm:left-[4.5%] md:left-[5%] w-[60%] sm:w-[52%] md:w-[48%] -rotate-[2.5deg]">
            <span className="block font-script text-[28px] xs:text-[34px] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-[104px] font-bold tracking-normal text-black leading-none drop-shadow-xs select-none whitespace-nowrap">
              Offre Spéciale
            </span>
          </div>

          {/* 2. Bloc Remise fidèle à 100% à l'image de référence :
               - Ligne 1 : -20% SUR (en jaune d'or)
               - Ligne 2 : VOTRE PREMIÈRE (en blanc)
               - Ligne 3 : COMMANDE (en blanc) */}
          <div className="absolute top-[50%] sm:top-[51%] md:top-[52%] -translate-y-1/2 left-[4%] sm:left-[5%] md:left-[6%] w-[50%] sm:w-[48%] md:w-[46%] space-y-0.5 sm:space-y-1 md:space-y-1.5 select-none">
            {/* Ligne 1 : -20% SUR */}
            <p className="font-display text-base xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-none text-bmc-gold drop-shadow-[0_2px_14px_rgba(252,184,0,0.4)]">
              -20% SUR
            </p>

            {/* Ligne 2 : VOTRE PREMIÈRE */}
            <p className="font-display text-sm xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              VOTRE PREMIÈRE
            </p>

            {/* Ligne 3 : COMMANDE */}
            <p className="font-display text-sm xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              COMMANDE
            </p>
          </div>

          {/* 3. Bouton interactif Or - Imposant, large et valorisé sur Desktop */}
          <div className="absolute bottom-[6%] xs:bottom-[7%] sm:bottom-[8%] md:bottom-[9%] left-[4%] sm:left-[5%] md:left-[6%] z-10 pointer-events-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation()
                handleAction()
              }}
              aria-label="Commander maintenant et profiter de l'offre spéciale -20%"
              className="inline-flex h-7 xs:h-8 sm:h-11 md:h-14 lg:h-16 xl:h-17 items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3.5 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-3 xs:px-4 sm:px-6 md:px-10 lg:px-12 xl:px-14 font-display text-[9px] xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-black uppercase tracking-wider text-black shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/40 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap"
            >
              <span>Commander Maintenant</span>
              <ArrowRight className="size-3 xs:size-3.5 sm:size-4 md:size-5 lg:size-6 stroke-[3] transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
