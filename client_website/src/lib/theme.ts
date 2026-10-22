/**
 * Design Tokens & Système de Couleurs Officiel BMC FOOD
 * Faction Frontend : El Hadji Massogui Diop (Lead), Maimouna Sall, Pape Alioune Sène.
 * 
 * ⚠️ FOND NOIR UNIFIÉ : Tout le site client et l'application Admin reposent
 * sur le même fond noir profond officiel : #0C0C0D.
 */

export const BMC_THEME = {
  colors: {
    // 1. Fond Noir Officiel BMC (pour tout le site client et l'admin)
    bg: '#0C0C0D',
    bgClass: 'bg-[#0C0C0D]',

    // 2. Surfaces de cartes de produits et conteneurs
    surface: '#121214',
    surfaceClass: 'bg-[#121214]',

    // 3. Surfaces surélevées (Header, modales, tiroir panier, dropdowns)
    surfaceElevated: '#18181B',
    surfaceElevatedClass: 'bg-[#18181B]',

    // 4. Bordures subtiles haute visibilité
    border: '#27272A', // zinc-800
    borderClass: 'border-zinc-800',
    borderSubtle: '#1F1F23',

    // 5. Or officiel de la toque BMC, étoiles, prix et accents
    gold: '#FCB800',
    goldClass: 'text-bmc-gold bg-bmc-gold',

    // 6. Rouge vif d'action (boutons 'Commander maintenant', pastilles promo)
    red: '#E11D48',
    redHover: '#BE123C',
    redClass: 'bg-[#E11D48] hover:bg-[#BE123C]',

    // 7. Orange braise officiel de la charte
    orangeBraise: '#CF4A08',

    // 8. Textes
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA', // zinc-400
    textMuted: '#71717A',     // zinc-500

    // 9. Moyens de paiement Sénégal
    wave: '#1DC8F2',
    orangeMoney: '#FF7900',
  },
  typography: {
    sans: 'Inter, system-ui, sans-serif',
    display: 'Bricolage Grotesque, system-ui, sans-serif',
  },
  shadows: {
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
    floating: '0 20px 40px -10px rgba(0, 0, 0, 0.85)',
    glowGold: '0 0 25px rgba(252, 184, 0, 0.25)',
    glowRed: '0 0 25px rgba(225, 29, 72, 0.35)',
  },
  radii: {
    card: 'rounded-2xl',      // 16-20px
    pill: 'rounded-full',     // boutons
    badge: 'rounded-lg',      // 8px
    sheet: 'rounded-t-[32px]', // bottom sheets gourmets
  },
} as const
