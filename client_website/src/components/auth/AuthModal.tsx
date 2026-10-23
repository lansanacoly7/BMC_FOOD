import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  User,
  Phone,
  Lock,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle,
  LogOut,
  ShieldCheck,
  Sparkles,
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
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load existing client user
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bmc_client_user')
      if (saved) {
        setCurrentUser(JSON.parse(saved))
      }
    } catch {
      // Ignore json parse error
    }
  }, [isOpen])

  // Reset fields on modal open
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanPhone = phone.trim().replace(/\s+/g, '')
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Veuillez entrer un numéro de téléphone valide (ex: 77 856 13 13).')
      return
    }

    if (password.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.')
      return
    }

    if (mode === 'register' && !name.trim()) {
      setError('Veuillez entrer votre prénom et nom.')
      return
    }

    setIsLoading(true)

    // Simulate instant client auth & session storage
    setTimeout(() => {
      setIsLoading(false)
      const user: ClientUser = {
        name: mode === 'register' ? name.trim() : (currentUser?.name || 'Client BMC'),
        phone: cleanPhone,
      }

      localStorage.setItem('bmc_client_user', JSON.stringify(user))
      setCurrentUser(user)
      setSuccessMessage(
        mode === 'register'
          ? 'Bienvenue chez BMC FOOD ! Votre compte a été créé avec succès.'
          : 'Connexion réussie ! Heureux de vous revoir chez BMC FOOD.'
      )

      if (onSuccess) {
        onSuccess(user)
      }

      setTimeout(() => {
        onClose()
      }, 1500)
    }, 600)
  }

  const handleLogout = () => {
    localStorage.removeItem('bmc_client_user')
    setCurrentUser(null)
    setName('')
    setPhone('')
    setPassword('')
    setSuccessMessage('Déconnexion effectuée avec succès.')
    setTimeout(() => {
      setSuccessMessage(null)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop sombre avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
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

            {/* En-tête avec logo officiel BMC Food */}
            <div className="text-center mb-6">
              <div className="relative mx-auto inline-block mb-3">
                <div className="absolute -inset-2 rounded-full bg-bmc-gold/20 blur-md" />
                <img
                  src="/images/brand/logo.png"
                  alt="BMC Food Logo"
                  width={90}
                  height={90}
                  className="relative h-16 w-auto object-contain mx-auto"
                />
              </div>

              <h2 className="font-display text-xl font-black uppercase tracking-tight text-white">
                Espace Client <span className="text-bmc-gold">BMC FOOD</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Commandez plus vite, suivez vos livraisons et profitez des offres exclusives.
              </p>
            </div>

            {/* Si déjà connecté : vue compte client */}
            {currentUser && !successMessage ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-bmc-gold/30 bg-zinc-900/80 p-4 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-bmc-gold/20 text-bmc-gold mb-2">
                    <User className="size-6" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-bmc-gold">Connecté en tant que</p>
                  <p className="font-display text-lg font-bold text-white mt-0.5">{currentUser.name}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{currentUser.phone}</p>
                </div>

                <div className="space-y-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-emerald-400 shrink-0" />
                    <span>Vos coordonnées sont pré-remplies lors de votre commande</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-bmc-gold shrink-0" />
                    <span>Accès prioritaire aux promotions et Plats du Jour</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-bmc-gold to-amber-500 font-display text-xs font-black uppercase tracking-wider text-black hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continuer mes commandes</span>
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
            ) : (
              <>
                {/* Sélecteur Onglets : Connexion vs Inscription */}
                <div className="flex rounded-xl bg-zinc-900 p-1 mb-5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError(null)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-bmc-gold to-amber-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <LogIn className="size-3.5" />
                    <span>Connexion</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('register')
                      setError(null)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      mode === 'register'
                        ? 'bg-gradient-to-r from-bmc-gold to-amber-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="size-3.5" />
                    <span>Inscription</span>
                  </button>
                </div>

                {/* Message de succès */}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs font-semibold text-emerald-300"
                  >
                    <CheckCircle className="size-4 shrink-0 text-emerald-400" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}

                {/* Message d'erreur */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/15 p-3 text-xs font-semibold text-rose-300"
                  >
                    <ShieldCheck className="size-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        Prénom & Nom
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="ex: Amadou Diallo"
                          className="w-full h-11 pl-10 pr-3 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      Numéro de téléphone (Sénégal)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Bouton de validation */}
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
                        <span>
                          {mode === 'login' ? 'Se connecter à BMC FOOD' : 'Créer mon compte client'}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                {/* Pied de formulaire : basculer mode */}
                <div className="mt-4 text-center">
                  {mode === 'login' ? (
                    <p className="text-xs text-zinc-400">
                      Nouveau client ?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register')
                          setError(null)
                        }}
                        className="font-bold text-bmc-gold hover:underline cursor-pointer"
                      >
                        Créer un compte en 30s
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      Vous avez déjà un compte ?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login')
                          setError(null)
                        }}
                        className="font-bold text-bmc-gold hover:underline cursor-pointer"
                      >
                        Connectez-vous ici
                      </button>
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
