import { Clock, MapPin, Phone, Sparkles, Utensils, ShieldCheck, ArrowUpRight } from 'lucide-react'

interface FooterProps {
  onExploreMenu?: () => void
}

/**
 * Footer Officiel BMC Food Dakar
 * Conforme aux directives de Maimouna Sall :
 * - Logo officiel BMC Food mis en valeur (grand, net, lumineux à gauche)
 * - Éléments parfaitement équilibrés et alignés sur la même ligne (suppression des décalages haut/bas)
 * - Badges de paiement Wave, Orange Money et Espèces spacieux et alignés horizontalement
 * - Données de redirection BMC (Menus, Horaires, Livraison Dakar, Qualité)
 */
export function Footer({ onExploreMenu }: FooterProps) {
  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else if (onExploreMenu) {
      onExploreMenu()
    }
  }

  return (
    <footer
      aria-label="Pied de page institutionnel BMC Food"
      className="relative mt-16 sm:mt-24 border-t border-amber-500/20 bg-gradient-to-b from-zinc-950 via-black to-black text-zinc-300 overflow-hidden"
    >
      {/* Halo doré d'ambiance en arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 blur-3xl rounded-full"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 space-y-10">
        
        {/* =====================================================================
            LIGNE 1 : MARQUE BMC FOOD MISE EN VALEUR + MOYENS DE PAIEMENT ALIGNÉS
            ===================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-8 border-b border-white/10">
          
          {/* Logo BMC Food majestueux mis en valeur à gauche */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0 p-1.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border border-amber-500/40 shadow-xl shadow-amber-500/10">
              <img
                src="/images/brand/logo.png"
                alt="Logo officiel BMC Food Dakar"
                width={96}
                height={96}
                className="size-16 sm:size-20 object-contain filter drop-shadow-[0_4px_16px_rgba(252,184,0,0.4)]"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-bmc-gold">
                <Sparkles className="size-3 text-bmc-gold" />
                <span>Fast-Food Gourmet · Dakar</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                BMC FOOD <span className="bg-gradient-to-r from-bmc-gold to-amber-400 bg-clip-text text-transparent">Dakar</span>
              </h3>
              <p className="text-xs text-zinc-300 mt-1 max-w-md">
                Tacos panés signatures, Burgers gourmets saisis à la flamme & Poulet crispy préparés minute à la commande.
              </p>
            </div>
          </div>

          {/* Moyens de paiement : alignés horizontalement sur la même ligne */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 sm:hidden">
              Paiements Sécurisés :
            </span>

            {/* Wave */}
            <div className="inline-flex items-center gap-2.5 rounded-xl bg-zinc-900/90 border border-[#1DC8F2]/30 px-3.5 py-2 shadow-sm transition-all hover:border-[#1DC8F2]/70 hover:bg-zinc-900">
              <img
                src="/images/payments/wave.png"
                alt="Paiement Wave Sénégal"
                width={32}
                height={32}
                className="size-7 sm:size-8 rounded-lg object-contain bg-white/5 p-0.5 shrink-0"
              />
              <div className="text-left">
                <span className="font-bold text-xs text-[#1DC8F2] block leading-tight">Wave</span>
                <span className="text-[10px] text-zinc-300 block leading-tight">0% frais</span>
              </div>
            </div>

            {/* Orange Money */}
            <div className="inline-flex items-center gap-2.5 rounded-xl bg-zinc-900/90 border border-[#FF7900]/30 px-3.5 py-2 shadow-sm transition-all hover:border-[#FF7900]/70 hover:bg-zinc-900">
              <img
                src="/images/payments/orange_money.png"
                alt="Paiement Orange Money Sénégal"
                width={32}
                height={32}
                className="size-7 sm:size-8 rounded-lg object-contain bg-white/5 p-0.5 shrink-0"
              />
              <div className="text-left">
                <span className="font-bold text-xs text-[#FF7900] block leading-tight">Orange Money</span>
                <span className="text-[10px] text-zinc-300 block leading-tight">Code / QR</span>
              </div>
            </div>

            {/* Espèces */}
            <div className="inline-flex items-center gap-2.5 rounded-xl bg-zinc-900/90 border border-amber-500/30 px-3.5 py-2 shadow-sm transition-all hover:border-amber-400/70 hover:bg-zinc-900">
              <img
                src="/images/payments/cash.png"
                alt="Paiement en Espèces"
                width={32}
                height={32}
                className="size-7 sm:size-8 rounded-lg object-contain bg-white/5 p-0.5 shrink-0"
              />
              <div className="text-left">
                <span className="font-bold text-xs text-amber-300 block leading-tight">Espèces</span>
                <span className="text-[10px] text-zinc-300 block leading-tight">Au livreur</span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            LIGNE 2 : 3 COLONNES PARFAITEMENT ÉQUILIBRÉES & ALIGNÉES SUR LA MÊME LIGNE
            ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Colonne 1 : Redirections Carte & Menus */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-bmc-gold flex items-center gap-1.5 pb-2 border-b border-white/10">
              <Utensils className="size-3.5 text-bmc-gold" />
              <span>Redirection & Menus</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-section')}
                  className="group flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1.5 rounded-full bg-amber-500/50 group-hover:bg-bmc-gold transition-colors" />
                  <span>Notre Carte Complète</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-catalog-grid')}
                  className="group flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1.5 rounded-full bg-amber-500/50 group-hover:bg-bmc-gold transition-colors" />
                  <span>Les Plus Commandés</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-section')}
                  className="group flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1.5 rounded-full bg-amber-500/50 group-hover:bg-bmc-gold transition-colors" />
                  <span>Tacos Panés Signatures</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-section')}
                  className="group flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1.5 rounded-full bg-amber-500/50 group-hover:bg-bmc-gold transition-colors" />
                  <span>Burgers Gourmets & Frites</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 2 : Horaires d'Ouverture & Livraison */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-bmc-gold flex items-center gap-1.5 pb-2 border-b border-white/10">
              <Clock className="size-3.5 text-bmc-gold" />
              <span>Horaires & Livraison</span>
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 animate-pulse shadow-sm shadow-emerald-400/50" />
                <div>
                  <p className="font-bold text-white">Service Continu 7j/7</p>
                  <p className="text-zinc-300 text-xs">De 11h00 à 02h00 du matin (non-stop)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-bmc-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Livraison Express Dakar</p>
                  <p className="text-zinc-300 text-xs">Livré chaud en 30 à 45 minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne 3 : Contact & Engagements Qualité */}
          <div className="space-y-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-bmc-gold flex items-center gap-1.5 pb-2 border-b border-white/10">
              <ShieldCheck className="size-3.5 text-bmc-gold" />
              <span>Contact & Engagements</span>
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Phone className="size-4 text-bmc-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Commande Directe Dakar</p>
                  <p className="text-zinc-300 text-xs">Service client dédié & écoute active</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-white/10 text-[11px] font-semibold text-zinc-300">
                  <ShieldCheck className="size-3 text-bmc-gold" />
                  100% Halal
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-white/10 text-[11px] font-semibold text-zinc-300">
                  <Sparkles className="size-3 text-bmc-gold" />
                  Produits Frais
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-white/10 text-[11px] font-semibold text-zinc-300">
                  Fait Maison
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* =====================================================================
            LIGNE 3 : BARRE COPYRIGHT & MENTIONS
            ===================================================================== */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-300 text-center sm:text-left">
          <p>© {new Date().getFullYear()} BMC FOOD Dakar · Tous droits réservés.</p>
          <p>
            Plateforme conçue avec passion par <span className="text-zinc-300 font-semibold">Teranga Labs</span>.
          </p>
        </div>

      </div>
    </footer>
  )
}
