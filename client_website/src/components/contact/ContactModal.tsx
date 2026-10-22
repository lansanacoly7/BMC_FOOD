import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, Heart, MapPin, MessageCircle, Phone, Star, Truck, X } from 'lucide-react'

export interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  if (!isOpen) return null

  const deliveryZones = [
    {
      name: 'Almadies & Ngor',
      time: '15 – 20 min',
      image: '/images/products/tacos-viande-pane.webp',
    },
    {
      name: 'Ouakam & Mermoz',
      time: '20 – 25 min',
      image: '/images/products/burger-bmc-complet.webp',
    },
    {
      name: 'Plateau & Fann',
      time: '25 – 35 min',
      image: '/images/products/chicken-wings-bbq.webp',
    },
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop sombre et flouté */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Contenu façon Sheet gourmet avec logo circulaire flottant (Design Screenshot 1) */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-sheet-title"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:rounded-3xl bg-[#121214] text-white shadow-2xl border border-zinc-800 text-left p-6 pt-16 scrollbar-none"
        >
          {/* Logo circulaire flottant qui chevauche le haut de la fiche (Design Screenshot 1) */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20">
            <div className="relative size-32 sm:size-36 rounded-full overflow-hidden border-4 border-[#121214] shadow-2xl bg-zinc-950 ring-2 ring-bmc-gold/50 flex items-center justify-center p-4">
              <img
                src="/images/brand/logo.png"
                alt="BMC Food"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {/* Boutons d'en-tête (Fermer et Favori) */}
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la vue contact"
              className="flex size-9 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              aria-label="Ajouter aux favoris"
              className="flex size-9 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Heart
                className={`size-5 transition-colors ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-300'
                }`}
              />
            </button>
          </div>

          {/* En-tête : Badge notation & Titre */}
          <div className="mt-4 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-bold text-bmc-gold">
              <Star className="size-3.5 fill-current" />
              <span>4.9 · Élu Meilleur Fast-Food Dakar</span>
            </div>

            <h2
              id="contact-sheet-title"
              className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-white"
            >
              BMC FOOD Dakar
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-md leading-relaxed">
              Le goût du vrai plaisir. Fast-food gourmet spécialisé en tacos panés croustillants, burgers et rafraîchissements livrés chauds chez vous.
            </p>
          </div>

          {/* Grille des 4 informations clés (4 carrés comme les Ingrédients du Screenshot 1) */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 text-center sm:text-left">
              Coordonnées & Horaires
            </h3>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {/* Téléphone */}
              <a
                href="tel:+221770000000"
                className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3 text-center transition-all hover:border-bmc-gold/50 group"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-800 text-bmc-gold group-hover:scale-110 transition-transform">
                  <Phone className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-bold text-white">Appels</span>
                <span className="text-[10px] text-zinc-400">+221 77 000 00</span>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/221770000000?text=Bonjour%20BMC%20FOOD%2C%20je%20souhaite%20passer%20une%20commande"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3 text-center transition-all hover:border-emerald-500/50 group"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-bold text-white">WhatsApp</span>
                <span className="text-[10px] text-zinc-400">Direct 24/7</span>
              </a>

              {/* Adresse */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-800 text-bmc-gold">
                  <MapPin className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-bold text-white">Adresse</span>
                <span className="text-[10px] text-zinc-400">Almadies, Dakar</span>
              </div>

              {/* Horaires */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-800 text-bmc-gold">
                  <Clock className="size-5" />
                </div>
                <span className="mt-2 text-[11px] font-bold text-white">Service</span>
                <span className="text-[10px] text-zinc-400">11h – 02h 7j/7</span>
              </div>
            </div>
          </div>

          {/* Moyens de paiement acceptés */}
          <div className="mt-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-bmc-gold" />
              <span className="text-xs font-semibold text-zinc-300">Paiements acceptés :</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="text-zinc-200">Espèces</span>
              <span className="text-zinc-600">·</span>
              <span className="text-[#1DC8F2]">Wave</span>
              <span className="text-zinc-600">·</span>
              <span className="text-[#FF7900]">Orange Money</span>
            </div>
          </div>

          {/* Boutons d'action (comme Total & Annuler du Screenshot 1) */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 border-t border-zinc-800/80 pt-5">
            <a
              href="https://wa.me/221770000000?text=Bonjour%20BMC%20FOOD%2C%20je%20souhaite%20commander%20un%20tacos%20pan%C3%A9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 font-display text-sm font-black text-white shadow-lg transition-transform active:scale-98 cursor-pointer"
            >
              <MessageCircle className="size-4.5" />
              <span>Commander sur WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 px-5 py-3.5 font-display text-sm font-bold text-zinc-300 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>

          {/* Zones de livraison desservies (comme "Suggestions d'association" du Screenshot 1) */}
          <div className="mt-6 border-t border-zinc-800/60 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Zones de Livraison Express
              </h3>
              <span className="text-[11px] text-bmc-gold font-semibold">
                Dakar & Banlieue
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {deliveryZones.map((zone, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center rounded-xl bg-zinc-900/90 border border-zinc-800 p-2 text-center"
                >
                  <div className="size-14 rounded-lg overflow-hidden bg-zinc-800">
                    <img
                      src={zone.image}
                      alt={zone.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="mt-1.5 font-display text-[11px] font-bold text-white line-clamp-1">
                    {zone.name}
                  </span>
                  <span className="text-[10px] text-bmc-gold font-semibold">
                    {zone.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
