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
  Sparkles,
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

  return (
    <div className="theme-dark min-h-[100dvh] w-full bg-[#090A0E] text-left text-[#F2F4F7] font-sans antialiased grid lg:grid-cols-[1.15fr_1fr] selection:bg-[#FCB800]/30 selection:text-white">
      {/* ─── PANNEAU GAUCHE : MARQUE & VISUEL HERO ───────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-[#0C0C0D] border-r border-white/[0.07] lg:flex flex-col justify-between p-12">
        {/* Image de fond avec filtre haute qualité */}
        <img
          src="/images/hero/tacos_signature_slate.webp"
          alt="BMC Food Spécialité"
          className="absolute inset-0 size-full object-cover opacity-45 scale-105 transition-transform duration-1000 hover:scale-100"
        />
        {/* Dégradés superposés pour lisibilité parfaite */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0E] via-[#090A0E]/60 to-[#090A0E]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,184,0,0.12),transparent_50%)]" />

        {/* Logo en haut à gauche */}
        <div className="relative z-10">
          <img
            src="/images/brand/logo.png"
            alt="BMC Food"
            className="h-20 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* Message d'ambiance et badges en bas */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCB800]/15 border border-[#FCB800]/30 text-xs font-bold text-[#FCB800] uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="size-3" />
              <span>Grillades & Fast-Food Dakar</span>
            </div>
            <h2 className="font-display text-4xl xl:text-5xl font-black leading-tight text-white tracking-tight drop-shadow-md">
              Le goût du <span className="text-[#FCB800]">vrai plaisir</span>.
            </h2>
            <p className="text-sm text-neutral-300 font-medium">
              Dakar · Ouvert tous les jours de 11h à 02h
            </p>
          </div>

          {/* Points forts de la franchise */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs text-neutral-400">
            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
              🔥 Cuisson braise & feu de bois
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
              ⚡ Cuisine KDS temps réel
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
              🛵 Livraison rapide Dakar
            </span>
          </div>
        </div>
      </aside>

      {/* ─── PANNEAU DROIT : FORMULAIRE EN THÈME NOIR HAUT DE GAMME ──────── */}
      <main className="relative flex flex-col justify-center items-center px-6 py-12 bg-[#0E1015] overflow-y-auto">
        {/* Lumière d'ambiance dorée très douce en arrière-plan */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(252,184,0,0.06),transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(circle,rgba(207,74,8,0.05),transparent_70%)] pointer-events-none" />

        {/* Logo mobile uniquement */}
        <div className="flex justify-center mb-8 lg:hidden">
          <img src="/images/brand/logo.png" alt="BMC Food" className="h-16 w-auto object-contain" />
        </div>

        {/* Carte de connexion sombre et stylée */}
        <div className="w-full max-w-[420px] rounded-2xl bg-[#141720]/90 border border-[#272B36] p-8 sm:p-9 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl relative z-10">
          {/* Badge statut */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-semibold text-[#FCB800] mb-4">
            <ShieldCheck className="size-3.5 text-[#FCB800]" />
            <span>Portail d’Administration</span>
          </div>

          <h1 className="font-display text-3xl font-extrabold text-[#F2F4F7] tracking-tight">
            Connexion
          </h1>
          <p className="mt-1.5 text-sm text-[#8A93A3] leading-relaxed">
            Accédez à la gestion des commandes, à la cuisine KDS et aux opérations.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {/* Alerte d'erreur stylée sombre */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-[#2D1214] border border-[#EF4444]/40 px-3.5 py-3 text-xs text-[#EF4444] animate-in fade-in duration-200"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Champ Identifiant */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]"
              >
                Identifiant
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 size-4 text-[#71717A] pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex : admin, gerant, cuisine..."
                  required
                  autoFocus
                  autoComplete="username"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#090A0E] border border-[#2B303C] text-sm text-[#F2F4F7] placeholder:text-[#5E6676] transition-all focus:outline-none focus:border-[#FCB800] focus:ring-1 focus:ring-[#FCB800]"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA]"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-semibold text-[#FCB800] hover:text-[#E5A700] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 size-4 text-[#71717A] pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#090A0E] border border-[#2B303C] text-sm text-[#F2F4F7] placeholder:text-[#5E6676] transition-all focus:outline-none focus:border-[#FCB800] focus:ring-1 focus:ring-[#FCB800]"
                />
              </div>
            </div>

            {/* Bouton de validation chaleureux et percutant */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 !mt-6 rounded-xl bg-gradient-to-r from-[#CF4A08] to-[#EA580C] hover:from-[#B53F06] hover:to-[#CF4A08] text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_4px_24px_rgba(207,74,8,0.35)] hover:shadow-[0_6px_28px_rgba(207,74,8,0.5)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Pied de carte discret */}
          <div className="mt-8 pt-5 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-[#71717A]">
            <span>BMC Food Dakar © 2026</span>
            <span className="flex items-center gap-1 text-[#8A93A3]">
              <Lock className="size-3 text-[#FCB800]" />
              Connexion sécurisée SSL
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
