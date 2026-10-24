import React, { useState } from 'react'
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
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
      setErrorMessage('Veuillez renseigner votre identifiant et votre mot de passe.')
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
          setErrorMessage('Identifiants invalides ou compte non autorisé.')
        }
      } else {
        setErrorMessage(
          error?.message || 'Connexion impossible. Vérifiez vos identifiants ou l’état du serveur.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setUsername('admin')
    setPassword('admin123')
    setErrorMessage(null)
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
      style={{ backgroundColor: '#0B0D10' }}
    >
      {/* Halo lumineux ambre d'arrière-plan */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none opacity-20 blur-[120px]"
        style={{ backgroundColor: '#F5B301' }}
        aria-hidden="true"
      />

      {/* CARTE DE CONNEXION */}
      <div
        className="w-full max-w-md rounded-2xl border p-8 flex flex-col gap-6 relative z-10 shadow-2xl backdrop-blur-md"
        style={{
          backgroundColor: '#14171C',
          borderColor: '#232830',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* EN-TÊTE : LOGO OFFICIEL + TITRE */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="relative inline-block mb-1">
            <div
              className="absolute -inset-2 rounded-full blur-md opacity-30"
              style={{ backgroundColor: '#F5B301' }}
            />
            <img
              src="/images/brand/logo.png"
              alt="BMC Food"
              width={80}
              height={80}
              className="relative h-14 w-auto object-contain mx-auto"
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-tight" style={{ color: '#F2F4F7' }}>
                BMC FOOD
              </h1>
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: '#0B0D10',
                  borderColor: '#232830',
                  color: '#F5B301',
                }}
              >
                ADMIN
              </span>
            </div>
            <p className="text-xs font-semibold mt-1" style={{ color: '#9AA3AF' }}>
              Portail d’administration & KDS Cuisine
            </p>
          </div>
        </div>

        {/* MESSAGE D'ERREUR */}
        {errorMessage && (
          <div
            className="p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-bold animate-in fade-in duration-200"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderColor: 'rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
            }}
            role="alert"
          >
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Identifiant */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#9AA3AF' }}
            >
              Identifiant / Utilisateur
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#6C7684' }}
              />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="Ex. admin"
                className="w-full h-11 pl-10 pr-4 rounded-xl text-sm font-semibold transition-all border focus:outline-none"
                style={{
                  backgroundColor: '#0B0D10',
                  borderColor: username ? '#F5B301' : '#232830',
                  color: '#F2F4F7',
                }}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#9AA3AF' }}
            >
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#6C7684' }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-11 rounded-xl text-sm font-semibold transition-all border focus:outline-none"
                style={{
                  backgroundColor: '#0B0D10',
                  borderColor: password ? '#F5B301' : '#232830',
                  color: '#F2F4F7',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Bouton Se connecter */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-2 rounded-xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wider transition-all transform active:scale-[0.98] select-none shadow-md disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: '#F5B301',
              color: '#0B0D10',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Connexion en cours…</span>
              </span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        {/* RACCOURCI DÉMO / DEV */}
        <div className="pt-2 border-t flex flex-col items-center gap-2" style={{ borderColor: '#232830' }}>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>Remplir les identifiants démo (admin / admin123)</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <ShieldCheck size={13} />
            <span>Accès restreint au personnel autorisé BMC FOOD</span>
          </div>
        </div>
      </div>

      {/* PIED DE PAGE DISCRET */}
      <footer className="mt-6 text-center text-xs font-medium text-slate-500">
        BMC FOOD · Grillades & Cuisine Dakar · Système KDS v2.0
      </footer>
    </div>
  )
}
