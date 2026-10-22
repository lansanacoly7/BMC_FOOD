import { ArrowRight, Sparkles, Tag } from 'lucide-react'
import { motion } from 'motion/react'

interface SpecialOfferBannerProps {
  onOrderNow?: () => void
}

/**
 * Bannière promotionnelle intermédiaire pleine largeur « Offre Spéciale »
 * Adaptée strictement aux retours de Maimouna Sall :
 * - Affichage sur UNE SEULE LIGNE (côte à côte) sur MOBILE comme sur DESKTOP (jamais empilé en haut/en bas)
 * - Largeur totale de l'écran (w-full sans marges latérales)
 * - Tailles de police et visuel calibrés pour s'aligner harmonieusement sur petit écran
 * - Visuel 100% adapté aux spécialités réelles BMC Food (Burgers gourmands, Tenders croustillants, frites dorées)
 */
export function SpecialOfferBanner({ onOrderNow }: SpecialOfferBannerProps) {
  const handleAction = () => {
    if (onOrderNow) {
      onOrderNow()
    } else {
      const target = document.getElementById('menu-catalog-grid') || document.getElementById('menu-section')
      target?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      aria-label="Offre spéciale première commande"
      className="relative w-full overflow-hidden border-y border-amber-500/25 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 py-3.5 sm:py-8 lg:py-12 my-3 sm:my-6"
    >
      {/* Lueur d'ambiance dorée d'arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-1/2 -translate-y-1/2 size-48 sm:size-96 rounded-full bg-amber-500/10 blur-2xl sm:blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 size-48 sm:size-96 rounded-full bg-amber-400/10 blur-2xl sm:blur-3xl"
      />

      {/* Conteneur pleine largeur : alignement STRICT sur une seule ligne (side-by-side) mobile & desktop */}
      <div className="w-full px-3 sm:px-6 lg:px-12 xl:px-16">
        <div className="grid grid-cols-12 items-center gap-2.5 sm:gap-6 lg:gap-10">
          
          {/* COLONNE GAUCHE (7 colonnes sur mobile, 7 sur desktop) : Textes & CTA sur une ligne */}
          <div className="col-span-7 flex flex-col items-start justify-center text-left">
            {/* Badge Pinceau / Brush doré jaune */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1 rounded-sm bg-gradient-to-r from-amber-400 via-bmc-gold to-amber-500 px-2 py-0.5 sm:px-3.5 sm:py-1 text-[9px] xs:text-[10px] sm:text-xs font-black uppercase tracking-wider text-black shadow-sm transform -rotate-1"
            >
              <Sparkles className="size-2.5 sm:size-3.5 fill-black text-black shrink-0" />
              <span>Offre Spéciale</span>
            </motion.div>

            {/* Titre percutant -20% */}
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="mt-1 sm:mt-2 font-display text-sm xs:text-base sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight sm:leading-none"
            >
              -20% SUR VOTRE{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-bmc-gold via-amber-300 to-amber-400">
                1ÈRE COMMANDE
              </span>
            </motion.h3>

            {/* Condition et Code Promo adaptés au mobile sans encombrer */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="mt-1 sm:mt-2 flex flex-wrap items-center gap-1.5 text-[10px] xs:text-[11px] sm:text-sm text-zinc-300 leading-tight"
            >
              <span className="hidden xs:inline">Dès 5 000 FCFA</span>
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-zinc-900/90 px-1.5 py-0.5 text-[9px] xs:text-[10px] sm:text-xs font-bold text-amber-300">
                <Tag className="size-2.5 sm:size-3 text-bmc-gold shrink-0" />
                <span>CODE : <strong className="font-mono font-black text-white">BIENVENUE20</strong></span>
              </span>
            </motion.div>

            {/* Bouton d'action Or BMC */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.22 }}
              className="mt-2 sm:mt-4 lg:mt-6"
            >
              <button
                type="button"
                onClick={handleAction}
                aria-label="Profiter de l'offre spéciale et commander"
                className="group inline-flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-3 py-1.5 xs:px-4 xs:py-2 sm:px-7 sm:py-3 text-[10px] xs:text-xs sm:text-sm font-black text-black shadow-md hover:brightness-110 hover:scale-102 transition-all cursor-pointer"
              >
                <span>Commander</span>
                <span className="hidden xs:inline">Maintenant</span>
                <ArrowRight className="size-3 sm:size-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          {/* COLONNE DROITE (5 colonnes) : Visuel culinaire appétissant BMC Food sur la même ligne */}
          <div className="col-span-5 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative aspect-4/3 w-full max-w-[145px] xs:max-w-[180px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[480px] overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl border border-white/10 shadow-xl bg-zinc-950 group shrink-0"
            >
              {/* Image culinaire réelle BMC Food */}
              <img
                src="/images/products/special-offer-banner.jpg"
                alt="Offre spéciale BMC Food - Burger gourmet et Tenders croustillants"
                width={800}
                height={450}
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Dégradé doux de fusion latérale */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"
              />

              {/* Pastille flottante "100% Frais" (visible à partir de petit écran) */}
              <div className="hidden xs:flex absolute bottom-1.5 right-1.5 sm:bottom-3 sm:right-3 items-center gap-1 rounded-full bg-black/85 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] font-black uppercase text-bmc-gold backdrop-blur-md border border-bmc-gold/40 shadow-md">
                <Sparkles className="size-2 sm:size-2.5 text-bmc-gold fill-bmc-gold" />
                <span>100% Frais</span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
