import { Clock, MapPin, Phone, Sparkles, Utensils, ShieldCheck, ArrowUpRight } from 'lucide-react'

interface FooterProps {
  onExploreMenu?: () => void
}

/**
 * Footer Officiel BMC Food Dakar
 * Conforme aux directives de Maimouna Sall :
 * - Footer structuré et compact (ni trop grand, ni encombré)
 * - Logo officiel BMC Food mis en valeur avec éclat Dark Luxury
 * - Données de redirection BMC (Menu, Spécialités, Offres, Horaires, Contact)
 * - Badges de paiement agrandis (Wave, Orange Money, Espèces) avec leurs couleurs officielles subtiles
 * - Style haut de gamme Dark Luxury & Or BMC (#FCB800)
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
      {/* Lueur dorée d'ambiance en arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 blur-3xl rounded-full"
      />

      {/* Conteneur Principal Structuré */}
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          
          {/* 1. COLONNE IDENTITÉ DE MARQUE (4 cols sur Desktop) */}
          <div className="space-y-4 lg:col-span-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/brand/logo.png"
                alt="BMC Food Dakar Logo"
                width={120}
                height={50}
                className="h-12 sm:h-14 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(252,184,0,0.3)]"
              />
              <div>
                <span className="font-display text-lg font-extrabold tracking-tight text-white block">
                  BMC FOOD <span className="text-bmc-gold">Dakar</span>
                </span>
                <span className="text-[11px] font-medium text-amber-400/90 uppercase tracking-widest block">
                  Saveurs Signatures
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-sm">
              L'adresse fast-food de référence à Dakar : Tacos panés signatures, Burgers gourmets saisis à la flamme et Poulet ultra crispy préparés minute à la commande.
            </p>

            {/* Badges de réassurance */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-zinc-300">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10">
                <ShieldCheck className="size-3.5 text-bmc-gold" />
                100% Halal
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10">
                <Sparkles className="size-3.5 text-bmc-gold" />
                Produits Frais
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10">
                <Utensils className="size-3.5 text-bmc-gold" />
                Fait Maison
              </span>
            </div>
          </div>

          {/* 2. COLONNE REDIRECTIONS & NAVIGATION (3 cols sur Desktop) */}
          <div className="space-y-3 lg:col-span-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-bmc-gold flex items-center gap-1.5">
              <span>Navigation Rapide</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-section')}
                  className="group flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1 rounded-full bg-amber-500/60 group-hover:bg-bmc-gold transition-colors" />
                  <span>Notre Carte Complète</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-catalog-grid')}
                  className="group flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1 rounded-full bg-amber-500/60 group-hover:bg-bmc-gold transition-colors" />
                  <span>Les Plus Commandés</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-section')}
                  className="group flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1 rounded-full bg-amber-500/60 group-hover:bg-bmc-gold transition-colors" />
                  <span>Tacos Panés Signatures</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-section')}
                  className="group flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1 rounded-full bg-amber-500/60 group-hover:bg-bmc-gold transition-colors" />
                  <span>Burgers Gourmets & Frites</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('menu-section')}
                  className="group flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="size-1 rounded-full bg-amber-500/60 group-hover:bg-bmc-gold transition-colors" />
                  <span>Poulet Crispy & Tenders</span>
                  <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-bmc-gold" />
                </button>
              </li>
            </ul>
          </div>

          {/* 3. COLONNE HORAIRES & CONTACT DAKAR (2 cols sur Desktop) */}
          <div className="space-y-3 lg:col-span-2">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-bmc-gold">
              Service & Horaires
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <Clock className="size-4 text-bmc-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Ouvert 7j/7</p>
                  <p className="text-zinc-300 text-[11px]">11h00 – 02h00 (non-stop)</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-bmc-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Dakar, Sénégal</p>
                  <p className="text-zinc-300 text-[11px]">Livraison express partout</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="size-4 text-bmc-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Commande Directe</p>
                  <p className="text-zinc-300 text-[11px]">Livraison en 30–45 min</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. COLONNE MOYENS DE PAIEMENT SÉCURISÉS (3 cols sur Desktop) - AGRANDIS & COLORÉS */}
          <div className="space-y-3 lg:col-span-3">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-bmc-gold">
              Paiements Acceptés
            </h4>
            <p className="text-xs text-zinc-300">
              Réglez en toute sécurité et simplicité lors de votre commande ou à la réception :
            </p>

            <div className="flex flex-col gap-2 pt-1">
              {/* Wave */}
              <div className="flex items-center gap-3 rounded-xl bg-zinc-900/90 border border-[#1DC8F2]/30 px-3 py-2 shadow-sm transition-all hover:border-[#1DC8F2]/70 hover:bg-zinc-900">
                <img
                  src="/images/payments/wave.png"
                  alt="Paiement Wave Sénégal"
                  width={32}
                  height={32}
                  className="size-8 rounded-lg object-contain bg-white/5 p-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#1DC8F2] block tracking-wide">
                    Wave Sénégal
                  </span>
                  <span className="text-[10px] text-zinc-300 block truncate">
                    Paiement instantané 0% frais
                  </span>
                </div>
              </div>

              {/* Orange Money */}
              <div className="flex items-center gap-3 rounded-xl bg-zinc-900/90 border border-[#FF7900]/30 px-3 py-2 shadow-sm transition-all hover:border-[#FF7900]/70 hover:bg-zinc-900">
                <img
                  src="/images/payments/orange_money.png"
                  alt="Paiement Orange Money Sénégal"
                  width={32}
                  height={32}
                  className="size-8 rounded-lg object-contain bg-white/5 p-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-[#FF7900] block tracking-wide">
                    Orange Money
                  </span>
                  <span className="text-[10px] text-zinc-300 block truncate">
                    Code marchand & QR code
                  </span>
                </div>
              </div>

              {/* Espèces à la livraison */}
              <div className="flex items-center gap-3 rounded-xl bg-zinc-900/90 border border-amber-500/30 px-3 py-2 shadow-sm transition-all hover:border-amber-400/70 hover:bg-zinc-900">
                <img
                  src="/images/payments/cash.png"
                  alt="Paiement en Espèces"
                  width={32}
                  height={32}
                  className="size-8 rounded-lg object-contain bg-white/5 p-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-amber-300 block tracking-wide">
                    Espèces
                  </span>
                  <span className="text-[10px] text-zinc-300 block truncate">
                    Paiement direct au livreur
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* LIGNE INFÉRIEURE : COPYRIGHT & SIGNATURE TERANGA LABS */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-300">
          <p>© {new Date().getFullYear()} BMC FOOD Dakar · Tous droits réservés.</p>
          <p className="text-zinc-300">
            Plateforme conçue avec passion par <span className="text-zinc-300 font-semibold">Teranga Labs</span>.
          </p>
        </div>
      </div>
    </footer>
  )
}
