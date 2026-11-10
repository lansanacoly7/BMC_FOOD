import React, { useState } from 'react'
import {
  AlertCircle,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Flame,
  Zap,
  Bike,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { loginAdmin } from '../api/client'

interface LoginPageProps {
  onLoginSuccess: (username: string) => void
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Renseignez votre identifiant et votre mot de passe.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await loginAdmin(username.trim(), password)
      onLoginSuccess(result.username || username)
    } catch (err: unknown) {
      const error = err as { message?: string; payload?: Record<string, unknown> }
      if (error?.payload && typeof error.payload === 'object') {
        const firstKey = Object.keys(error.payload)[0]
        const val = error.payload[firstKey]
        if (Array.isArray(val) && val.length > 0) {
          setErrorMessage(String(val[0]))
        } else if (typeof val === 'string') {
          setErrorMessage(val)
        } else {
          setErrorMessage('Identifiant ou mot de passe incorrect.')
        }
      } else {
        setErrorMessage(error?.message || 'Connexion impossible. Réessayez dans un instant.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Remplissage rapide démo pour faciliter les tests
  const handleQuickFill = () => {
    setUsername('admin')
    setPassword('admin')
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#08090D] text-left text-[#F2F4F7] font-sans antialiased grid lg:grid-cols-[1.15fr_1fr] selection:bg-[#FCB800]/30 selection:text-white overflow-hidden">
      {/* ─── PANNEAU GAUCHE : IDENTITÉ VISUELLE & HERO RESTAURANT BMC ─── */}
      <aside className="relative hidden overflow-hidden bg-[#0A0C10] border-r border-white/[0.08] lg:flex flex-col justify-between p-12">
        {/* Photographie culinaire haute résolution avec mouvement lent Ken-Burns */}
        <img
          src="/images/hero/hero_cheeseburger.webp"
          alt="BMC Food Spécialité"
          className="absolute inset-0 size-full object-cover opacity-80 animate-kenburns pointer-events-none"
        />

        {/* Dégradés cinématiques superposés pour fondre avec le panneau droit */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090D] via-[#08090D]/40 to-[#08090D]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#08090D]/30 to-[#08090D] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,184,0,0.22),transparent_55%)] pointer-events-none" />

        {/* Logo officiel en haut à gauche */}
        <div className="relative z-10 transition-transform duration-300 hover:scale-[1.02]">
          <img
            src="/images/brand/logo.png"
            alt="BMC Food"
            className="h-20 w-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
          />
        </div>

        {/* Slogan officiel et éléments interactifs remis */}
        <div className="relative z-10 space-y-5 max-w-xl">
          <div className="space-y-2">
            <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tight drop-shadow-lg">
              Le goût du <span className="text-[#FCB800]">vrai plaisir</span>.
            </h2>
            <p className="text-sm text-neutral-300 font-medium">
              Dakar · Ouvert tous les jours de 11h à 02h
            </p>
          </div>

          {/* Mini-widget KDS dynamique en direct */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#FCB800]/15 border border-[#FCB800]/30 flex items-center justify-center shrink-0">
                <Zap className="size-5 text-[#FCB800]" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Cuisine KDS connectée</span>
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Synchronisation temps réel & alertes de cuisson
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-[#FCB800] flex items-center justify-end gap-1">
                <Clock className="size-3.5" />
                <span>&lt; 12 min</span>
              </div>
              <div className="text-[11px] text-neutral-400">Temps moyen</div>
            </div>
          </div>

          {/* Piliers de service */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/10 text-xs text-neutral-300">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <Flame className="size-3.5 text-[#FCB800] shrink-0" />
              <span>Grillades & Braise</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <Zap className="size-3.5 text-[#FCB800] shrink-0" />
              <span>Écran Cuisine KDS</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <Bike className="size-3.5 text-[#FCB800] shrink-0" />
              <span>Livraison Dakar</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── PANNEAU DROIT : FORMULAIRE ÉLÉGANT AVEC BOUTON JAUNE BMC ─── */}
      <main className="relative flex flex-col justify-center items-center px-6 py-12 bg-[#090A0E] bg-grid-pattern overflow-y-auto">
        {/* Halos d'ambiance respirants en arrière-plan */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(252,184,0,0.12),transparent_70%)] animate-ambient-glow pointer-events-none" />
        <div className="absolute bottom-8 right-8 w-72 h-72 bg-[radial-gradient(circle,rgba(252,184,0,0.06),transparent_70%)] animate-ambient-warm pointer-events-none" />

        {/* Logo mobile uniquement */}
        <div className="flex flex-col items-center mb-8 lg:hidden animate-fade-in-up">
          <img src="/images/brand/logo.png" alt="BMC Food" className="h-16 w-auto object-contain" />
          <span className="mt-2 text-xs font-semibold text-[#FCB800]">Portail d'Administration</span>
        </div>

        {/* CARTE DE CONNEXION LUXE & ÉPURÉE */}
        <div className="w-full max-w-[440px] rounded-3xl bg-[#12151E]/90 border border-white/[0.1] border-t-2 border-t-[#FCB800] p-8 sm:p-10 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(252,184,0,0.06)] backdrop-blur-2xl relative z-10 animate-card-enter">
          {/* En-tête de la carte : Badge officiel BMC Food */}
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FCB800]/15 border border-[#FCB800]/30 shadow-sm">
              <Flame className="size-4 text-[#FCB800]" />
              <span className="text-xs font-black text-[#FCB800] uppercase tracking-wider">
                BMC Food · Back-Office
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-semibold text-neutral-300">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>Accès Sécurisé</span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Connexion
          </h1>
          <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
            Accédez à la gestion des commandes, à la cuisine KDS et aux opérations.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {/* Alerte d'erreur */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-[#2D1214] border border-[#EF4444]/40 px-3.5 py-3 text-xs text-[#EF4444] animate-fade-in-up"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Champ Identifiant */}
            <div className="space-y-1.5 group">
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-[#CBD5E1] group-focus-within:text-[#FCB800] transition-colors duration-200"
              >
                Identifiant
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 size-4 text-[#64748B] group-focus-within:text-[#FCB800] transition-colors duration-200 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, gerant, cuisine..."
                  required
                  autoFocus
                  autoComplete="username"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#0B0D14] border border-white/[0.12] text-sm text-[#F2F4F7] placeholder:text-[#5E6676] transition-all duration-200 focus:outline-none focus:border-[#FCB800] focus:ring-4 focus:ring-[#FCB800]/20 hover:border-white/25"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-1.5 pt-1 group">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#CBD5E1] group-focus-within:text-[#FCB800] transition-colors duration-200"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-semibold text-[#FCB800] hover:text-[#FFE066] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 size-4 text-[#64748B] group-focus-within:text-[#FCB800] transition-colors duration-200 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#0B0D14] border border-white/[0.12] text-sm text-[#F2F4F7] placeholder:text-[#5E6676] transition-all duration-200 focus:outline-none focus:border-[#FCB800] focus:ring-4 focus:ring-[#FCB800]/20 hover:border-white/25"
                />
              </div>
            </div>

            {/* ─── BOUTON JAUNE BMC FOOD (Demande explicite de l'utilisateur) ─── */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative overflow-hidden group w-full h-13 !mt-6 rounded-xl bg-gradient-to-r from-[#FFD000] via-[#FCB800] to-[#F59E0B] hover:from-[#FFE043] hover:to-[#FCB800] text-[#090A0E] font-black text-base tracking-wide transition-all duration-200 shadow-[0_8px_30px_rgba(252,184,0,0.45)] hover:shadow-[0_12px_40px_rgba(252,184,0,0.7)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Balayage de lumière au survol */}
              <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[350%] transition-transform duration-1000 ease-out pointer-events-none" />

              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin text-[#090A0E]" />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1 text-[#090A0E]" />
                </>
              )}
            </button>
          </form>

          {/* Bandeau d'accès rapide démo */}
          <div
            onClick={handleQuickFill}
            className="mt-6 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs text-[#94A3B8] cursor-pointer transition-all hover:bg-white/[0.06] hover:border-[#FCB800]/40 group"
            title="Cliquer pour renseigner automatiquement les accès admin"
          >
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Accès démo : <strong className="text-white group-hover:text-[#FCB800] transition-colors">admin</strong></span>
            </span>
            <span className="text-[11px] text-[#64748B] flex items-center gap-1 group-hover:text-neutral-300">
              <CheckCircle2 className="size-3 text-[#FCB800]" />
              Remplir en 1 clic
            </span>
          </div>

          {/* Pied de carte avec icône de sécurité et copyright */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>BMC Food Dakar © 2026</span>
            <span className="flex items-center gap-1 text-[#94A3B8]">
              <Lock className="size-3 text-[#FCB800]" />
              Connexion sécurisée SSL
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
