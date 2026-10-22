import { ArrowRight, CheckCircle2, Tag } from 'lucide-react'
import { motion } from 'motion/react'

interface SpecialOfferBannerProps {
  onOrderNow?: () => void
}

/**
 * Bannière promotionnelle officielle BMC Food
 * Conforme aux directives de Maimouna Sall :
 * - Mobile (< 1024px) : 100% préservé sans aucune modification du design actuel
 * - Desktop (>= 1024px) : Correction du milieu vide avec ajout de texte informatif (avantages gourmands & code promo BMC20), typographie complète non tronquée et visuel food net sans artéfacts
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
      {/* =========================================================================
          1. VERSION MOBILE & TABLETTE (< 1024px) : 100% INTACTE (Demandé par Maimouna)
          ========================================================================= */}
      <div
        className="lg:hidden relative w-full overflow-hidden border-y border-amber-500/20 bg-black group cursor-pointer"
        onClick={handleAction}
      >
        <img
          src="/images/products/special-offer-banner.jpg"
          alt="Offre Spéciale -20% sur votre première commande BMC Food"
          width={1920}
          height={590}
          className="w-full h-auto max-h-[220px] sm:max-h-[340px] object-cover block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          loading="lazy"
        />

        <div className="absolute left-[4%] sm:left-[5%] bottom-[8%] sm:bottom-[10%] z-10">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              handleAction()
            }}
            aria-label="Commander maintenant et profiter de l'offre spéciale -20%"
            className="group/btn inline-flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-3.5 py-1.5 xs:px-4 xs:py-2 sm:px-6 sm:py-2.5 text-[10px] xs:text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-xl shadow-amber-500/35 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap"
          >
            <span>Commander</span>
            <span className="hidden xs:inline">Maintenant</span>
            <ArrowRight className="size-3 sm:size-3.5 stroke-[3] transition-transform duration-300 group-hover/btn:translate-x-1" />
          </motion.button>
        </div>
      </div>

      {/* =========================================================================
          2. VERSION DESKTOP (>= 1024px) : CORRECTION DU MILIEU VIDE & ÉQUILIBRE LUXE
          - Ne touche pas au mobile (comme demandé)
          - Habille le milieu vide avec code promo et points forts BMC Food
          - Affiche le visuel gourmand haute définition à droite sans superposition
          ========================================================================= */}
      <div
        className="hidden lg:flex relative w-full overflow-hidden border-y border-amber-500/25 bg-gradient-to-r from-black via-zinc-950 to-black cursor-pointer group items-center justify-between min-h-[250px] xl:min-h-[280px]"
        onClick={handleAction}
      >
        {/* Halo doré d'ambiance en arrière-plan */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl"
        />

        {/* Bloc Gauche : Offre Spéciale & Action */}
        <div className="relative z-10 pl-8 xl:pl-14 py-6 max-w-sm xl:max-w-md shrink-0">
          <div className="inline-block -rotate-2 px-3 py-1 rounded bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 text-black font-display text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/25">
            Offre Spéciale
          </div>

          <h3 className="mt-3 font-display text-3xl xl:text-4xl font-extrabold uppercase tracking-tight text-white leading-[1.08]">
            <span className="text-bmc-gold">-20% SUR</span> <br />
            VOTRE PREMIÈRE <br />
            COMMANDE
          </h3>

          <div className="mt-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation()
                handleAction()
              }}
              aria-label="Commander maintenant et profiter de l'offre -20%"
              className="group/btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-6 py-2.5 text-xs xl:text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/30 hover:brightness-110 cursor-pointer transition-all whitespace-nowrap"
            >
              <span>Commander Maintenant</span>
              <ArrowRight className="size-4 stroke-[3] transition-transform duration-300 group-hover/btn:translate-x-1" />
            </motion.button>
          </div>
        </div>

        {/* Bloc Milieu : Texte et Code Promo (remplit le milieu vide avec harmonie) */}
        <div className="relative z-10 px-6 py-4 flex flex-col items-center justify-center text-center max-w-sm xl:max-w-md mx-auto">
          {/* Badge Code Promo BMC20 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 backdrop-blur-sm shadow-inner">
            <Tag className="size-4 text-bmc-gold shrink-0" />
            <span className="text-xs uppercase tracking-wider text-zinc-300">
              Code Promo :{' '}
              <strong className="font-mono font-black text-sm text-white tracking-widest bg-amber-500/25 px-2.5 py-0.5 rounded border border-amber-500/40">
                BMC20
              </strong>
            </span>
          </div>

          {/* 3 Avantages phares BMC Food */}
          <div className="mt-4 space-y-2 text-left text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-bmc-gold shrink-0" />
              <span>Burgers gourmets, Tacos panés & Tenders croustillants</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-bmc-gold shrink-0" />
              <span>Pain brioché toasté minute & sauces signatures maison</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-bmc-gold shrink-0" />
              <span>Livraison express chaude partout à Dakar (11h – 02h)</span>
            </div>
          </div>

          <p className="mt-3 text-[10.5px] text-zinc-300 italic">
            *Valable 7j/7 dès 5 000 FCFA d'achat sur tout notre menu
          </p>
        </div>

        {/* Bloc Droite : Visuel Food Haute Définition Fumé et Net */}
        <div className="relative h-full flex items-center justify-end shrink-0 pr-4 xl:pr-8">
          <img
            src="/images/products/banner-food-desktop.png"
            alt="Spécialités BMC Food : Double Burger Gourmet, Tenders et Frites"
            width={474}
            height={571}
            className="h-[230px] xl:h-[265px] w-auto object-contain block transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
