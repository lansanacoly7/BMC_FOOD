import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  LogOut,
  ShieldCheck,
  Phone,
} from 'lucide-react'

export interface ClientUser {
  name: string
  phone: string
  email?: string
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: ClientUser) => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  // Mode unique : 'login' (connexion unique pour tous) ou 'register' (création de compte client)
  const [view, setView] = useState<'login' | 'register'>('login')

  // Champs de connexion unique
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Champs d'inscription (si nouveau compte)
  const [registerName, setRegisterName] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  // État de session
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Charger la session existante
  useEffect(() => {
    try {
      const savedClient = localStorage.getItem('bmc_client_user')
      if (savedClient) {
        setCurrentUser(JSON.parse(savedClient))
      }
    } catch {
      // Ignorer
    }
  }, [isOpen])

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

  // Connexion unique (détecte automatiquement Admin ou Client)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanId = identifier.trim()
    if (!cleanId || !password.trim()) {
      setError('Veuillez renseigner votre identifiant/téléphone et votre mot de passe.')
      return
    }

    setIsLoading(true)

    // 1. Tenter l'authentification auprès de l'API Django DRF (pour les comptes Admin / Staff)
    try {
      const response = await fetch('/api/auth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: cleanId,
          password: password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const token = data.token
        const username = data.username || cleanId
        localStorage.setItem('bmc_admin_token', token)
        localStorage.setItem('bmc_admin_username', username)

        setSuccessMessage('Connexion réussie ! Redirection vers l’espace administration & cuisine...')
        setTimeout(() => {
          window.location.href = 'http://localhost:5174/'
        }, 1200)
        return
      }
    } catch {
      // Poursuivre vers la vérification locale / client
    }

    // 2. Démo administrateur en fallback local
    if (
      (cleanId.toLowerCase() === 'admin' && password === 'admin123') ||
      (cleanId.toLowerCase() === 'supervisor' && password === 'admin123')
    ) {
      const demoToken = '5950ee892e2812d22579dfb9527874765235f85e'
      localStorage.setItem('bmc_admin_token', demoToken)
      localStorage.setItem('bmc_admin_username', cleanId)
      setSuccessMessage('Connexion administrateur réussie ! Redirection vers la cuisine KDS...')
      setTimeout(() => {
        window.location.href = 'http://localhost:5174/'
      }, 1200)
      setIsLoading(false)
      return
    }

    // 3. Connexion Client standard (par numéro de téléphone ou nom)
    setTimeout(() => {
      setIsLoading(false)
      const user: ClientUser = {
        name: isNaN(Number(cleanId.replace(/\s+/g, ''))) ? cleanId : 'Client BMC',
        phone: cleanId,
      }

      localStorage.setItem('bmc_client_user', JSON.stringify(user))
      setCurrentUser(user)
      setSuccessMessage('Connexion réussie ! Bienvenue sur BMC FOOD.')

      if (onSuccess) {
        onSuccess(user)
      }

      setTimeout(() => {
        onClose()
      }, 1200)
    }, 500)
  }

  // Inscription nouveau compte client
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanPhone = registerPhone.trim().replace(/\s+/g, '')
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Veuillez entrer un numéro de téléphone valide (ex: 77 856 13 13).')
      return
    }

    if (registerPassword.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.')
      return
    }

    if (!registerName.trim()) {
      setError('Veuillez entrer votre prénom et nom.')
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      const user: ClientUser = {
        name: registerName.trim(),
        phone: cleanPhone,
      }

      localStorage.setItem('bmc_client_user', JSON.stringify(user))
      setCurrentUser(user)
      setSuccessMessage('Compte créé avec succès ! Bienvenue chez BMC FOOD.')

      if (onSuccess) {
        onSuccess(user)
      }

      setTimeout(() => {
        onClose()
      }, 1200)
    }, 500)
  }

  const handleLogout = () => {
    localStorage.removeItem('bmc_client_user')
    setCurrentUser(null)
    setIdentifier('')
    setPassword('')
    setSuccessMessage('Déconnexion effectuée avec succès.')
    setTimeout(() => {
      setSuccessMessage(null)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Arrière-plan sombre avec flou cinéma */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container Unique */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-8 shadow-2xl text-white"
            role="dialog"
            aria-modal="true"
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>

            {/* En-tête officiel unique : Logo BMC Food */}
            <div className="text-center mb-6">
              <div className="relative mx-auto inline-block mb-3">
                <div className="absolute -inset-2 rounded-full bg-bmc-gold/20 blur-md" />
                <img
                  src="/images/brand/logo.png"
                  alt="BMC Food"
                  width={84}
                  height={84}
                  className="relative h-15 w-auto object-contain mx-auto"
                />
              </div>

              <h2 className="font-display text-xl font-black uppercase tracking-tight text-white">
                {view === 'login' ? (
                  <>
                    Connexion <span className="text-bmc-gold">BMC FOOD</span>
                  </>
                ) : (
                  <>
                    Inscription <span className="text-bmc-gold">BMC FOOD</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {view === 'login'
                  ? 'Connectez-vous à votre espace avec vos identifiants'
                  : 'Créez votre compte en quelques secondes'}
              </p>
            </div>

            {/* Messages de retour */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs font-semibold text-emerald-300"
              >
                <CheckCircle className="size-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-semibold text-rose-300"
              >
                <ShieldCheck className="size-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Vue si déjà connecté */}
            {currentUser && !successMessage && view === 'login' ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-bmc-gold/30 bg-zinc-900/80 p-4 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-bmc-gold/20 text-bmc-gold mb-2">
                    <User className="size-6" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-bmc-gold">
                    Connecté en tant que
                  </p>
                  <p className="font-display text-lg font-bold text-white mt-0.5">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{currentUser.phone}</p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-bmc-gold to-amber-500 font-display text-xs font-black uppercase tracking-wider text-black hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continuer</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Se déconnecter"
                    className="h-11 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="size-4" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </button>
                </div>
              </div>
            ) : view === 'login' ? (
              /* FORMULAIRE DE CONNEXION UNIQUE */
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Identifiant ou Numéro de téléphone
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Ex: 77 856 13 13 ou admin"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Bouton de Connexion Unique */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-bmc-gold/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <img
                        src="/images/brand/logo.png"
                        alt="BMC"
                        className="h-5 w-auto object-contain shrink-0"
                      />
                      <span>Se connecter</span>
                    </>
                  )}
                </button>

                {/* Bascule vers Inscription */}
                <div className="mt-4 pt-3 border-t border-white/10 text-center">
                  <p className="text-xs text-zinc-400">
                    Pas encore de compte ?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setView('register')
                        setError(null)
                      }}
                      className="font-bold text-bmc-gold hover:underline cursor-pointer"
                    >
                      Créer un compte
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* FORMULAIRE D'INSCRIPTION */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Prénom & Nom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Ex: Amadou Diallo"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                      type="tel"
                      required
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="77 856 13 13"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-bmc-gold/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <img
                        src="/images/brand/logo.png"
                        alt="BMC"
                        className="h-5 w-auto object-contain shrink-0"
                      />
                      <span>Créer mon compte</span>
                    </>
                  )}
                </button>

                <div className="mt-4 pt-3 border-t border-white/10 text-center">
                  <p className="text-xs text-zinc-400">
                    Déjà un compte ?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setView('login')
                        setError(null)
                      }}
                      className="font-bold text-bmc-gold hover:underline cursor-pointer"
                    >
                      Se connecter
                    </button>
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
