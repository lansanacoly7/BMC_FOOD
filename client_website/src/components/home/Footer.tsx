import { ArrowRight, ArrowUp, ArrowUpRight, ChevronRight, Clock3, MapPin, Phone } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { isOpenAt } from '../../lib/greeting'
import { WhatsAppIcon } from '../brand/WhatsAppIcon'

type Page = 'home' | 'menu' | 'contact' | 'profile'

interface FooterProps {
  onExploreMenu?: () => void
  onNavigate?: (page: Page) => void
  /** Ouvre la carte directement sur une famille (mot-clé du nom de catégorie : « pane », « burger »…). */
  onSelectSpecialty?: (keyword: string) => void
  /** « Mon compte » : la page profil si le client est connecté, sinon la fenêtre de connexion. */
  onOpenAccount?: () => void
  /** Vrai quand la barre panier flottante est affichée : on lui garde de la place sous la dernière ligne. */
  reserveCartSpace?: boolean
}

const WHATSAPP_URL = 'https://wa.me/221778561313'
const MAPS_URL = 'https://maps.google.com/?q=PGXV%2B6R7,+Dakar'

const NAV_LINKS: { page: Page; label: string }[] = [
  { page: 'home', label: 'Accueil' },
  { page: 'menu', label: 'La carte' },
  { page: 'contact', label: 'Contact' },
  { page: 'profile', label: 'Mon compte' },
]

/** Les familles de la carte BMC (mêmes intitulés que les rondelles de la carte, qu'elles ouvrent directement). */
const SPECIALTIES = [
  { icon: 'taco', label: 'Tacos panés', keyword: 'tacos panes' },
  { icon: 'wrap', label: 'Tacos simples', keyword: 'simple' },
  { icon: 'burger', label: 'Burgers', keyword: 'burger' },
  { icon: 'chicken', label: 'Poulet & finger food', keyword: 'poulet' },
  { icon: 'drink', label: 'Boissons', keyword: 'boisson' },
] as const

const PAYMENTS = [
  { name: 'Wave', src: '/images/payments/wave.png' },
  { name: 'Orange Money', src: '/images/payments/orange_money.png' },
  { name: 'Espèces', src: '/images/payments/cash.png' },
]

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

/** Heure courante, rafraîchie chaque minute : le statut d'ouverture reste juste sans recharger. */
function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

/* ---------- Pictogrammes ---------- */

function SpecialtyIcon({ type }: { type: (typeof SPECIALTIES)[number]['icon'] }) {
  const paths: Record<typeof type, ReactNode> = {
    burger: (
      <>
        <rect x="3" y="10" width="18" height="7" rx="3.5" />
        <path d="M4 10c1-5 4-7 8-7s7 2 8 7M4 14h16M7 18v2m10-2v2" />
      </>
    ),
    taco: (
      <>
        <path d="M3 17c1-7 6-12 12-12 3 0 5 2 6 5L6 20c-2 1-4-1-3-3Z" />
        <path d="m8 14 2 2m2-5 2 2m2-5 2 2" />
      </>
    ),
    chicken: (
      <>
        <path d="M7 7c-2-2-5 0-4 3l4 4c-1 3 2 6 5 5l6-6c2-2 1-5-2-6-2-3-7-3-9 0Z" />
        <path d="m5 5-2-2m16 16 2 2" />
      </>
    ),
    wrap: (
      <>
        <path d="M6.5 20.5 3.5 17.5 15 6a4.24 4.24 0 0 1 6 6Z" />
        <path d="M15 6c1.7 1 2.6 2.6 3 4.4M7 14l3 3m1-7 3 3" />
      </>
    ),
    drink: (
      <>
        <path d="M6 7h12l-1 14H7L6 7Z" />
        <path d="M9 3h6l2 4H7l2-4Zm4 4 3-5" />
      </>
    ),
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-7 shrink-0 text-bmc-gold transition-transform duration-300 group-hover:scale-110"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[type]}
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.6-.1 4.8-.1Zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.1-9.4a1.1 1.1 0 1 0 0 2.3 1.1 1.1 0 0 0 0-2.3Z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      <path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 0 0-.8-.1 5.7 5.7 0 1 0 5.7 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5Z" />
    </svg>
  )
}

/** Comptes officiels uniquement (charte page 14 et enseigne du restaurant), plus le WhatsApp de commande. */
const SOCIALS = [
  { name: 'TikTok', label: 'TikTok @bmctacos', href: 'https://www.tiktok.com/@bmctacos', icon: <TikTokIcon /> },
  { name: 'Instagram', label: 'Instagram @bmctacos_senegal', href: 'https://www.instagram.com/bmctacos_senegal/', icon: <InstagramIcon /> },
  { name: 'WhatsApp', label: 'WhatsApp 77 856 13 13', href: WHATSAPP_URL, icon: <WhatsAppIcon className="size-4" /> },
]

/* ---------- Briques ---------- */

function ColumnTitle({ children, rule }: { children: ReactNode; rule: Variants }) {
  return (
    <>
      <h3 className="font-display text-base font-bold text-white">{children}</h3>
      <motion.span variants={rule} aria-hidden="true" className="mb-5 mt-2.5 block h-[3px] w-12 origin-left rounded-full bg-bmc-gold" />
    </>
  )
}

function ContactRow({ icon, iconColor, children }: { icon: ReactNode; iconColor?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span
        style={iconColor ? { color: iconColor } : undefined}
        className="grid size-10 shrink-0 place-items-center rounded-full text-bmc-gold ring-1 ring-bmc-gold/45 [&_svg]:size-[17px]"
      >
        {icon}
      </span>
      <div className="min-w-0 text-sm leading-snug">{children}</div>
    </div>
  )
}

/** Aperçu de la commande en ligne sur un téléphone, avec les vrais visuels du site. */
function PhonePreview({ float }: { float: boolean }) {
  return (
    <motion.div
      aria-hidden="true"
      animate={float ? { y: [0, -6, 0] } : undefined}
      transition={float ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      className="absolute right-2 top-1/2 z-0 w-[5.5rem] -translate-y-1/2 sm:right-4 sm:w-[6.25rem] lg:right-2 lg:w-[5.5rem]"
    >
      <div className="rotate-[7deg] rounded-[1.15rem] border-2 border-zinc-600 bg-[#050505] p-[5px] shadow-[0_14px_32px_rgb(0_0_0/0.8)]">
        <div className="relative overflow-hidden rounded-[0.8rem] bg-bmc-charcoal px-1.5 pb-2 pt-4">
          <span className="absolute left-1/2 top-1.5 h-1 w-6 -translate-x-1/2 rounded-full bg-black" />
          <img src="/images/brand/logo-principal.webp" alt="" width={640} height={483} loading="lazy" className="mx-auto h-6 w-auto" />
          <img
            src="/images/hero/tacos_signature_slate.webp"
            alt=""
            loading="lazy"
            decoding="async"
            className="mt-2 aspect-[4/3] w-full rounded-md object-cover"
          />
          <p className="mt-1.5 font-display text-[0.45rem] font-bold leading-none text-white">Nos incontournables</p>
          <span className="mt-1.5 block h-1 rounded-full bg-bmc-gold/60" />
          <span className="mt-1 block h-1 w-3/5 rounded-full bg-white/20" />
          <span className="mt-2 block rounded-md bg-bmc-gold py-1 text-center font-display text-[0.45rem] font-bold leading-none text-bmc-charcoal">
            Commander
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/** Carte « Commandez en ligne » : l'appel à commander, avec la livraison, les paiements et l'aperçu téléphone. */
function OrderCard({ titleId, onOrder, float }: { titleId: string; onOrder: () => void; float: boolean }) {
  return (
    <div className="relative flex min-h-[15rem] items-center overflow-hidden rounded-3xl bg-linear-to-br from-[#141414] to-[#050505] py-6 pl-5 pr-3 shadow-[0_24px_48px_rgb(0_0_0/0.55)] ring-1 ring-bmc-gold/40 lg:min-h-[16.5rem] lg:shadow-none">
      <div aria-hidden="true" className="absolute -right-10 -top-16 size-48 rounded-full [background:radial-gradient(circle,rgb(252_184_0/0.16),transparent_70%)]" />
      <div className="relative z-10 w-[64%] lg:w-[62%]">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-bmc-gold">BMC Food en ligne</p>
        <h3 id={titleId} className="mt-3 font-display text-xl font-bold leading-tight tracking-[-0.02em] text-white">
          Commandez
          <span className="block">en ligne,</span>
          <span className="block text-bmc-gold">on vous livre.</span>
        </h3>
        <button
          type="button"
          onClick={onOrder}
          className="group mt-4 inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full py-1 pl-4 pr-1 text-xs font-semibold text-white ring-1 ring-bmc-gold transition-colors hover:bg-bmc-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
        >
          <span>
            Commander<span className="lg:hidden"> maintenant</span>
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-bmc-gold text-bmc-charcoal transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </button>
        <p className="mt-3 text-[0.7rem] leading-relaxed text-zinc-400">
          Livraison dès 1 000 F
          <span className="block">20 à 45 min, partout à Dakar</span>
        </p>
        <ul className="mt-2.5 flex gap-1.5" aria-label="Moyens de paiement acceptés">
          {PAYMENTS.map((payment) => (
            <li key={payment.name} title={payment.name}>
              <img src={payment.src} alt={payment.name} width={28} height={28} loading="lazy" className="size-7 rounded-md bg-white object-contain p-0.5" />
            </li>
          ))}
        </ul>
      </div>
      <PhonePreview float={float} />
    </div>
  )
}

/** Gros bouton tactile du pied de page mobile : appeler, écrire sur WhatsApp, ouvrir l'itinéraire. */
function QuickAction({ href, icon, label, detail, external = false }: { href: string; icon: ReactNode; label: string; detail: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-white/[0.04] px-2 py-3 text-center ring-1 ring-white/10 transition-[background-color,box-shadow] active:bg-bmc-gold/10 hover:ring-bmc-gold/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold"
    >
      <span className="grid size-10 place-items-center rounded-full text-bmc-gold ring-1 ring-bmc-gold/45 [&_svg]:size-[18px]">{icon}</span>
      <span className="text-sm font-semibold leading-none text-white">{label}</span>
      <span className="text-[0.7rem] leading-none tabular-nums text-zinc-400">{detail}</span>
      {external && <span className="sr-only"> (nouvel onglet)</span>}
    </a>
  )
}

/**
 * Pied de page BMC Food, d'après la maquette validée :
 * 1. une grande photo de cuisine (le gobelet noir BMC est posé sur le comptoir) avec la signature de la marque ;
 * 2. cinq colonnes : marque, navigation, nos familles de produits, contact, carte « Commandez en ligne » ;
 * 3. une barre finale filetée d'or : droits, réseaux officiels, « À très bientôt ! ».
 * Adapté à la charte : logo officiel blanc et or (jamais recoloré), Bricolage Grotesque et Inter, or #FCB800,
 * aucun orange braise (réservé à la barre panier), uniquement les vraies coordonnées et les comptes officiels.
 */
export function Footer({ onExploreMenu, onNavigate, onSelectSpecialty, onOpenAccount, reserveCartSpace = false }: FooterProps) {
  const now = useMinuteClock()
  const isOpen = isOpenAt(now)
  const reduceMotion = useReducedMotion() ?? false
  const exploreMenu = onExploreMenu ?? (() => onNavigate?.('menu'))

  // Avec « réduire les animations », tout apparaît en fondu, sans déplacement.
  const reveal: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.3 : 0.75, ease: EASE_OUT_EXPO } },
  }
  const cascade: Variants = { hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.09 } } }
  const rule: Variants = {
    hidden: { scaleX: reduceMotion ? 1 : 0 },
    visible: { scaleX: 1, transition: { duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.25 } },
  }
  // L'arabesque se dévoile de haut en bas (découpe animée : le trait garde son épaisseur, sans pointillés).
  const sweep: Variants = {
    hidden: { clipPath: reduceMotion ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', opacity: reduceMotion ? 0 : 1 },
    visible: { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, transition: { duration: reduceMotion ? 0.3 : 1.8, ease: [0.65, 0, 0.35, 1], delay: 0.4 } },
  }
  // Le déclencheur est toujours un conteneur visible : un élément à l'échelle 0 n'est jamais « vu » par le navigateur.
  const inView = { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.25 } } as const

  return (
    <footer aria-label="Pied de page" className="relative mt-16 overflow-hidden bg-bmc-black text-zinc-100 sm:mt-24">
      {/* ===== 1. LA PHOTO ===== */}
      <motion.div {...inView} variants={cascade} className="relative h-[19rem] overflow-hidden sm:h-[clamp(22rem,44vw,40rem)]">
        <motion.img
          src="/images/footer/footer-gobelet.webp"
          srcSet="/images/footer/footer-gobelet-960.webp 960w, /images/footer/footer-gobelet.webp 1679w"
          sizes="100vw"
          alt="Un cuisinier BMC saupoudre d'épices un tacos pané servi avec des frites, à côté d'un gobelet noir BMC Food."
          width={1679}
          height={937}
          loading="lazy"
          decoding="async"
          variants={{
            hidden: { scale: reduceMotion ? 1 : 1.08 },
            visible: { scale: 1, transition: { duration: 2.4, ease: EASE_OUT_EXPO } },
          }}
          className="absolute inset-0 size-full object-cover object-[95%_70%]"
        />
        {/* Lisibilité du texte à gauche, et fondu vers le noir sous la photo */}
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-black/90 via-black/45 to-transparent sm:via-black/35" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bmc-black via-bmc-black/30 to-transparent" />

        {/* Arabesque d'or de la maquette : elle descend du coin et contourne le gobelet (grand écran) */}
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          variants={sweep}
          className="pointer-events-none absolute inset-0 hidden size-full lg:block"
        >
          <path
            d="M 99 -1 C 86 6, 78 22, 78 46 C 78 66, 80 80, 84 96"
            fill="none"
            stroke="#FCB800"
            strokeOpacity="0.7"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </motion.svg>

        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-start px-4 pt-9 sm:px-6 sm:pt-16 lg:justify-center lg:px-8 lg:pb-24 lg:pt-0">
          <motion.p variants={reveal} className="text-xs font-bold uppercase tracking-[0.22em] text-bmc-gold">
            BMC Food · Dakar
          </motion.p>
          <motion.h2
            variants={reveal}
            className="mt-3 font-display text-[2.35rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-white sm:mt-4 sm:text-6xl lg:text-7xl"
          >
            Le goût du
            <span className="block text-bmc-gold">vrai plaisir.</span>
          </motion.h2>
          <motion.div variants={reveal}>
            <button
              type="button"
              onClick={exploreMenu}
              className="group mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 border-b border-bmc-gold pb-1.5 text-sm font-bold text-white sm:mt-6 transition-colors hover:text-bmc-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bmc-gold"
            >
              Découvrir notre carte
              <ArrowUpRight
                className="size-4 text-bmc-gold transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* ===== 2a. TÉLÉPHONE ET TABLETTE : l'essentiel d'abord, au pouce ===== */}
      <motion.div
        {...inView}
        viewport={{ once: true, amount: 0.08 }}
        variants={cascade}
        className="relative z-10 mx-auto -mt-16 flex max-w-2xl flex-col gap-5 px-4 pb-8 sm:-mt-24 sm:px-6 lg:hidden"
      >
        {/* Commander : à cheval sur la photo */}
        <motion.section variants={reveal} aria-labelledby="footer-order-title-mobile">
          <OrderCard titleId="footer-order-title-mobile" onOrder={exploreMenu} float={!reduceMotion} />
        </motion.section>

        {/* Nous joindre en un geste */}
        <motion.nav variants={reveal} aria-label="Nous joindre" className="grid grid-cols-3 gap-2.5">
          <QuickAction href="tel:+221778561313" icon={<Phone aria-hidden="true" />} label="Appeler" detail="77 856 13 13" />
          <QuickAction href={WHATSAPP_URL} icon={<WhatsAppIcon />} label="WhatsApp" detail="Par message" external />
          <QuickAction href={MAPS_URL} icon={<MapPin aria-hidden="true" />} label="Itinéraire" detail="PGXV+6R7" external />
        </motion.nav>

        {/* Horaires et statut en direct */}
        <motion.div variants={reveal} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
          <Clock3 className="size-5 shrink-0 text-bmc-gold" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-sm leading-snug">
            <p className="font-semibold text-white">
              <span className="tabular-nums">11h – 02h</span> · mardi au dimanche
            </p>
            <p className="text-xs text-zinc-400">
              Fermé le lundi · aussi au{' '}
              <a href="tel:+221771067575" className="whitespace-nowrap tabular-nums text-zinc-300 underline-offset-2 hover:text-bmc-gold hover:underline">
                77 106 75 75
              </a>
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${
              isOpen ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-zinc-400'
            }`}
          >
            <span className={`size-1.5 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-zinc-500'}`} aria-hidden="true" />
            {isOpen ? 'Ouvert' : 'Fermé'}
          </span>
        </motion.div>

        {/* Nos spécialités : chaque pastille ouvre la carte sur sa famille */}
        <motion.section variants={reveal} aria-labelledby="footer-specialties-mobile" className="pt-2">
          <h3 id="footer-specialties-mobile" className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-bmc-gold">
            Nos spécialités
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SPECIALTIES.map((item) => (
              <li key={item.keyword}>
                <button
                  type="button"
                  onClick={() => (onSelectSpecialty ? onSelectSpecialty(item.keyword) : exploreMenu())}
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white/[0.04] pl-2.5 pr-3.5 text-sm text-zinc-100 ring-1 ring-white/12 transition-colors active:bg-bmc-gold/10 hover:text-bmc-gold hover:ring-bmc-gold/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bmc-gold [&_svg]:size-[18px]"
                >
                  <SpecialtyIcon type={item.icon} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Navigation */}
        <motion.nav variants={reveal} aria-label="Navigation du pied de page" className="border-y border-white/10">
          <ul className="grid grid-cols-2 gap-x-6">
            {NAV_LINKS.map((link) => (
              <li key={link.page}>
                <button
                  type="button"
                  onClick={() => (link.page === 'profile' && onOpenAccount ? onOpenAccount() : onNavigate?.(link.page))}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 text-left text-sm text-zinc-200 transition-colors hover:text-bmc-gold"
                >
                  {link.label}
                  <ChevronRight className="size-4 text-zinc-500" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </motion.nav>

        {/* Marque et réseaux */}
        <motion.section variants={reveal} aria-label="BMC Food" className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/images/brand/logo-principal.webp" alt="BMC Food" width={640} height={483} loading="lazy" className="h-12 w-auto shrink-0" />
            <p className="font-display text-sm font-bold leading-snug text-white">
              Le goût du vrai plaisir.
              <span className="block text-bmc-gold">Excellence in every bite.</span>
            </p>
          </div>
          <ul className="flex shrink-0 gap-2" aria-label="Nos réseaux">
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="grid size-10 place-items-center rounded-full text-zinc-100 ring-1 ring-white/40 transition-colors hover:text-bmc-gold hover:ring-bmc-gold"
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
        </motion.section>
      </motion.div>

      {/* ===== 2b. GRAND ÉCRAN : LES CINQ COLONNES ===== */}
      <motion.div
        {...inView}
        viewport={{ once: true, amount: 0.12 }}
        variants={cascade}
        className="relative z-10 mx-auto hidden max-w-7xl px-8 pb-12 lg:-mt-20 lg:grid lg:grid-cols-[1.2fr_0.8fr_1.1fr_1.15fr_1.45fr]"
      >
        {/* Marque */}
        <motion.section
          variants={reveal}
          aria-label="BMC Food"
          className="col-span-2 border-b border-white/15 pb-8 md:col-span-3 lg:col-span-1 lg:border-b-0 lg:pb-0 lg:pr-7"
        >
          <img src="/images/brand/logo-principal.webp" alt="BMC Food" width={640} height={483} loading="lazy" className="h-20 w-auto" />
          <p className="mt-6 font-display text-base font-bold leading-snug text-white sm:text-lg lg:text-base">
            Le goût du vrai plaisir.
            <span className="block text-bmc-gold">Excellence in every bite.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
            Tacos panés, burgers et boissons maison, préparés à la commande dans notre cuisine de Dakar.
          </p>
          <motion.span variants={rule} aria-hidden="true" className="mt-5 block h-[3px] w-20 origin-left rounded-full bg-bmc-gold" />
        </motion.section>

        {/* Navigation */}
        <motion.nav variants={reveal} aria-label="Navigation du pied de page" className="col-span-2 md:col-span-1 lg:border-l lg:border-white/15 lg:px-7">
          <ColumnTitle rule={rule}>Navigation</ColumnTitle>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-1">
            {NAV_LINKS.map((link) => (
              <li key={link.page}>
                <button
                  type="button"
                  onClick={() => (link.page === 'profile' && onOpenAccount ? onOpenAccount() : onNavigate?.(link.page))}
                  className="group flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 whitespace-nowrap text-left text-sm text-zinc-300 transition-colors hover:text-bmc-gold"
                >
                  {link.label}
                  <ChevronRight className="size-4 text-zinc-500 transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-bmc-gold" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </motion.nav>

        {/* Nos familles de produits */}
        <motion.section variants={reveal} aria-label="Nos spécialités" className="col-span-2 border-t border-white/15 pt-8 md:col-span-1 md:border-l md:border-t-0 md:pl-6 md:pt-0 lg:px-7">
          <ColumnTitle rule={rule}>Nos spécialités</ColumnTitle>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-1">
            {SPECIALTIES.map((item) => (
              <li key={item.keyword}>
                <button
                  type="button"
                  onClick={() => (onSelectSpecialty ? onSelectSpecialty(item.keyword) : exploreMenu())}
                  className="group flex min-h-10 cursor-pointer items-center gap-3 whitespace-nowrap text-left text-sm text-zinc-200 transition-colors hover:text-bmc-gold"
                >
                  <SpecialtyIcon type={item.icon} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Contact */}
        <motion.section
          variants={reveal}
          aria-label="Contact"
          className="col-span-2 border-t border-white/15 pt-8 md:col-span-1 md:border-l md:border-t-0 md:pl-6 md:pt-0 lg:px-6"
        >
          <ColumnTitle rule={rule}>Contact</ColumnTitle>
          <div className="flex flex-col gap-4">
            <ContactRow icon={<Phone aria-hidden="true" />}>
              <a href="tel:+221778561313" className="block font-semibold tabular-nums text-white transition-colors hover:text-bmc-gold">
                77 856 13 13
              </a>
              <a href="tel:+221771067575" className="block text-xs tabular-nums text-zinc-400 transition-colors hover:text-bmc-gold">
                ou 77 106 75 75
              </a>
            </ContactRow>
            <ContactRow icon={<MapPin aria-hidden="true" />}>
              <p className="font-semibold text-white">Dakar, Sénégal</p>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-zinc-400 transition-colors hover:text-bmc-gold"
              >
                PGXV+6R7 · Itinéraire<span className="sr-only"> (ouvre Google Maps)</span>
              </a>
            </ContactRow>
            <ContactRow icon={<WhatsAppIcon />}>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block font-semibold text-white transition-colors hover:text-bmc-gold">
                WhatsApp
              </a>
              <p className="text-xs text-zinc-400">Commandez par message</p>
            </ContactRow>
            <ContactRow icon={<Clock3 aria-hidden="true" />}>
              <p className="font-semibold tabular-nums text-white">11h – 02h</p>
              <p className="text-xs text-zinc-400">Mardi au dimanche, fermé le lundi</p>
              <p className="text-xs">
                <span className={`inline-flex items-center gap-1 font-semibold ${isOpen ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  <span className={`size-1.5 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-zinc-500'}`} aria-hidden="true" />
                  {isOpen ? 'ouvert maintenant' : 'fermé maintenant'}
                </span>
              </p>
            </ContactRow>
          </div>
        </motion.section>

        {/* Commande en ligne (à la place de l'application de la maquette : le site est le canal de commande) */}
        <motion.section
          variants={reveal}
          aria-labelledby="footer-order-title"
          className="col-span-2 md:col-span-3 lg:col-span-1 lg:ml-7"
        >
          <OrderCard titleId="footer-order-title" onOrder={exploreMenu} float={!reduceMotion} />
        </motion.section>
      </motion.div>

      {/* ===== 3a. LA BARRE FINALE (téléphone et tablette) ===== */}
      <div className="border-t border-bmc-gold/50 lg:hidden">
        <div className={`mx-auto flex max-w-2xl flex-col gap-1 px-4 pt-4 text-xs text-zinc-400 sm:px-6 ${reserveCartSpace ? 'pb-28' : 'pb-8'}`}>
          <div className="flex items-center justify-between gap-4">
            <p>© {now.getFullYear()} BMC Food</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-zinc-300 transition-colors hover:text-bmc-gold"
            >
              Retour en haut
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <p>
            Tous droits réservés · Site réalisé par <span className="text-zinc-200">Teranga Labs</span>
          </p>
        </div>
      </div>

      {/* ===== 3b. LA BARRE FINALE (grand écran) ===== */}
      <div className="hidden border-t border-bmc-gold/50 lg:block">
        <motion.div
          {...inView}
          variants={cascade}
          className={`mx-auto flex max-w-7xl flex-col gap-5 px-4 pt-6 text-xs text-zinc-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 ${
            reserveCartSpace ? 'pb-28' : 'pb-8'
          }`}
        >
          <motion.p variants={reveal}>
            © {now.getFullYear()} BMC Food. Tous droits réservés.
          </motion.p>

          <motion.div variants={reveal} className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="lg:border-l lg:border-bmc-gold/60 lg:pl-5">
              Site réalisé par <span className="text-zinc-200">Teranga Labs</span>
            </span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
              className="group inline-flex min-h-10 cursor-pointer items-center gap-1.5 border-l border-bmc-gold/60 pl-5 text-zinc-300 transition-colors hover:text-bmc-gold"
            >
              Retour en haut
              <ArrowUp className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
            </button>
          </motion.div>

          <motion.div variants={reveal} className="flex items-center gap-3">
            <span>Suivez-nous</span>
            <ul className="flex gap-2">
              {SOCIALS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="grid size-10 place-items-center rounded-full text-zinc-100 ring-1 ring-white/50 transition-[color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:text-bmc-gold hover:ring-bmc-gold"
                  >
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.p variants={reveal} className="self-end font-display text-2xl font-semibold tracking-[-0.02em] text-white lg:self-auto">
            À très bientôt&nbsp;!
            <motion.span variants={rule} aria-hidden="true" className="ml-auto mt-1 block h-0.5 w-3/4 origin-right -rotate-3 rounded-full bg-bmc-gold" />
          </motion.p>
        </motion.div>
      </div>
    </footer>
  )
}
