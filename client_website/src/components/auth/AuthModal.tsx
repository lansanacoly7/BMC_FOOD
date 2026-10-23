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
  ChefHat,
  ExternalLink,
  KeyRound,
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
  initialRole?: 'client' | 'admin'
}

export function AuthModal({ isOpen, onClose, onSuccess, initialRole = 'client' }: AuthModalProps) {
  // Rôle principal : Espace Client ou Espace Personnel / Admin
  const [role, setRole] = useState<'client' | 'admin'>(initialRole)

  // Mode Client : Connexion vs Inscription
  const [clientMode, setClientMode] = useState<'login' | 'register'>('login')
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null)

  // Champs Client
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Champs Admin
  const [adminUsername, setAdminUsername] = useState('admin')
  const [adminPassword, setAdminPassword] = useState('admin123')
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [adminConnectedUser, setAdminConnectedUser] = useState<string | null>(null)

  // États partagés
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Charger les sessions existantes
  useEffect(() => {
    try {
      const savedClient = localStorage.getItem('bmc_client_user')
      if (savedClient) {
        setCurrentUser(JSON.parse(savedClient))
      }
      const savedAdminToken = localStorage.getItem('bmc_admin_token')
      const savedAdminUser = localStorage.getItem('bmc_admin_username')
      if (savedAdminToken) {
        setAdminToken(savedAdminToken)
        setAdminConnectedUser(savedAdminUser || 'admin')
      }
    } catch {
      // Ignorer
    }
  }, [isOpen])

  // Réinitialiser les messages à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

  // Soumission Client
  const handleClientSubmit = (e: React.FormEvent) => {
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

    if (clientMode === 'register' && !name.trim()) {
      setError('Veuillez entrer votre prénom et nom.')
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      const user: ClientUser = {
        name: clientMode === 'register' ? name.trim() : (currentUser?.name || 'Client BMC'),
        phone: cleanPhone,
      }

      localStorage.setItem('bmc_client_user', JSON.stringify(user))
      setCurrentUser(user)
      setSuccessMessage(
        clientMode === 'register'
          ? 'Bienvenue chez BMC FOOD ! Votre compte client est activé.'
          : 'Connexion réussie ! Heureux de vous revoir chez BMC FOOD.'
      )

      if (onSuccess) {
        onSuccess(user)
      }

      setTimeout(() => {
        onClose()
      }, 1400)
    }, 500)
  }

  // Soumission Admin / Personnel
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Veuillez renseigner votre identifiant et votre mot de passe.')
      return
    }

    setIsLoading(true)

    try {
      // Tentative réelle auprès de l'API Django DRF
      const response = await fetch('/api/auth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const token = data.token
        const username = data.username || adminUsername.trim()
        localStorage.setItem('bmc_admin_token', token)
        localStorage.setItem('bmc_admin_username', username)
        setAdminToken(token)
        setAdminConnectedUser(username)
        setSuccessMessage('Connexion Admin & KDS réussie ! Redirection en cours...')
        setTimeout(() => {
          window.location.href = 'http://localhost:5174/'
        }, 1200)
      } else {
        // Fallback démo
        if (
          (adminUsername.trim() === 'admin' && adminPassword === 'admin123') ||
          (adminUsername.trim() === 'supervisor' && adminPassword === 'admin123')
        ) {
          const demoToken = '5950ee892e2812d22579dfb9527874765235f85e'
          localStorage.setItem('bmc_admin_token', demoToken)
          localStorage.setItem('bmc_admin_username', adminUsername.trim())
          setAdminToken(demoToken)
          setAdminConnectedUser(adminUsername.trim())
          setSuccessMessage('Connexion administrateur validée (Mode Démo) ! Redirection...')
          setTimeout(() => {
            window.location.href = 'http://localhost:5174/'
          }, 1200)
        } else {
          setError('Identifiants administrateur invalides ou accès non autorisé.')
        }
      }
    } catch {
      // Fallback hors-ligne
      if (adminUsername.trim() === 'admin' && adminPassword === 'admin123') {
        const demoToken = '5950ee892e2812d22579dfb9527874765235f85e'
        localStorage.setItem('bmc_admin_token', demoToken)
        localStorage.setItem('bmc_admin_username', 'admin')
        setAdminToken(demoToken)
        setAdminConnectedUser('admin')
        setSuccessMessage('Connexion administrateur locale validée ! Redirection...')
        setTimeout(() => {
          window.location.href = 'http://localhost:5174/'
        }, 1200)
      } else {
        setError('Impossible de joindre le serveur. Utilisez les identifiants démo (admin / admin123).')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoAdmin = () => {
    setAdminUsername('admin')
    setAdminPassword('admin123')
    setError(null)
  }

  const handleClientLogout = () => {
    localStorage.removeItem('bmc_client_user')
    setCurrentUser(null)
    setName('')
    setPhone('')
    setPassword('')
    setSuccessMessage('Déconnexion client effectuée.')
    setTimeout(() => {
      setSuccessMessage(null)
    }, 1500)
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('bmc_admin_token')
    localStorage.removeItem('bmc_admin_username')
    setAdminToken(null)
    setAdminConnectedUser(null)
    setSuccessMessage('Déconnexion administrateur effectuée.')
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

          {/* Fenêtre Modale Unifiée */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-5 sm:p-7 shadow-2xl text-white"
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

            {/* En-tête : Logo officiel BMC Food & Titre Unifié */}
            <div className="text-center mb-5">
              <div className="relative mx-auto inline-block mb-2.5">
                <div className="absolute -inset-2 rounded-full bg-bmc-gold/20 blur-md" />
                <img
                  src="/images/brand/logo.png"
                  alt="BMC Food"
                  width={80}
                  height={80}
                  className="relative h-14 w-auto object-contain mx-auto"
                />
              </div>

              <h2 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                Portail de Connexion <span className="text-bmc-gold">BMC FOOD</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                Accès unifié Espace Client et Administration Cuisine
              </p>
            </div>

            {/* FUSION : SÉLECTEUR DE RÔLE (CLIENT vs ADMIN / KDS) */}
            <div className="flex rounded-xl bg-zinc-900 p-1 mb-4 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setRole('client')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  role === 'client'
                    ? 'bg-gradient-to-r from-bmc-gold to-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <User className="size-3.5" />
                <span>Espace Client</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('admin')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-bmc-gold to-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ChefHat className="size-3.5" />
                <span>Admin & KDS</span>
              </button>
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

            {/* ================================================================= */}
            {/* 1. SECTION CLIENT : CONNEXION OU INSCRIPTION                      */}
            {/* ================================================================= */}
            {role === 'client' && (
              <>
                {currentUser && !successMessage ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-bmc-gold/30 bg-zinc-900/80 p-4 text-center">
                      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-bmc-gold/20 text-bmc-gold mb-2">
                        <User className="size-5" />
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-bmc-gold">
                        Client Connecté
                      </p>
                      <p className="font-display text-base font-bold text-white mt-0.5">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{currentUser.phone}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-3.5 text-emerald-400 shrink-0" />
                        <span>Coordonnées pré-remplies lors de votre commande</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-3.5 text-bmc-gold shrink-0" />
                        <span>Accès prioritaire aux promotions et nouveautés</span>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2.5">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-bmc-gold to-amber-500 font-display text-xs font-black uppercase tracking-wider text-black hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Continuer mes commandes</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClientLogout}
                        title="Se déconnecter"
                        className="h-11 px-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="size-3.5" />
                        <span className="hidden sm:inline">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Bascule Connexion vs Inscription Client */}
                    <div className="flex justify-center gap-4 mb-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setClientMode('login')
                          setError(null)
                        }}
                        className={`font-black uppercase tracking-wider pb-1 transition-colors cursor-pointer border-b-2 ${
                          clientMode === 'login'
                            ? 'text-bmc-gold border-bmc-gold'
                            : 'text-zinc-400 border-transparent hover:text-white'
                        }`}
                      >
                        <LogIn className="inline size-3.5 mr-1" />
                        Se connecter
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setClientMode('register')
                          setError(null)
                        }}
                        className={`font-black uppercase tracking-wider pb-1 transition-colors cursor-pointer border-b-2 ${
                          clientMode === 'register'
                            ? 'text-bmc-gold border-bmc-gold'
                            : 'text-zinc-400 border-transparent hover:text-white'
                        }`}
                      >
                        <UserPlus className="inline size-3.5 mr-1" />
                        Créer un compte
                      </button>
                    </div>

                    <form onSubmit={handleClientSubmit} className="space-y-3">
                      {clientMode === 'register' && (
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
                              className="w-full h-10.5 pl-10 pr-3 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
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
                            className="w-full h-10.5 pl-10 pr-3 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors font-mono"
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
                            className="w-full h-10.5 pl-10 pr-10 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
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

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-bmc-gold/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
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
                              {clientMode === 'login'
                                ? 'Se connecter à BMC FOOD'
                                : 'Créer mon compte client'}
                            </span>
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}

            {/* ================================================================= */}
            {/* 2. SECTION ADMIN & PERSONNEL (KDS CUISINE)                        */}
            {/* ================================================================= */}
            {role === 'admin' && (
              <div className="space-y-3.5">
                {adminToken && !successMessage ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-bmc-gold/40 bg-zinc-900/90 p-4 text-center">
                      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-bmc-gold/20 text-bmc-gold mb-2">
                        <ChefHat className="size-5" />
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-bmc-gold">
                        Session Admin Active
                      </p>
                      <p className="font-display text-base font-bold text-white mt-0.5">
                        {adminConnectedUser}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        Accès KDS Cuisine & Plat du Jour autorisé
                      </p>
                    </div>

                    <div className="flex gap-2.5">
                      <a
                        href="http://localhost:5174/"
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-bmc-gold to-amber-500 font-display text-xs font-black uppercase tracking-wider text-black hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                      >
                        <span>Ouvrir KDS Cuisine</span>
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={handleAdminLogout}
                        title="Se déconnecter de l'admin"
                        className="h-11 px-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="size-3.5" />
                        <span className="hidden sm:inline">Quitter</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAdminSubmit} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-bmc-gold flex items-center gap-1">
                        <KeyRound className="size-3" />
                        Accès Réservé Équipe & Direction
                      </span>
                      <button
                        type="button"
                        onClick={fillDemoAdmin}
                        className="text-[10px] font-bold text-zinc-400 hover:text-white underline cursor-pointer"
                      >
                        Remplir démo
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        Identifiant / Nom d'utilisateur
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="admin"
                          className="w-full h-10.5 pl-10 pr-3 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        Mot de passe administrateur
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-10.5 pl-10 pr-10 rounded-xl border border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:border-bmc-gold focus:outline-none transition-colors"
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

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 mt-1 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 font-display text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-bmc-gold/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ChefHat className="size-4 shrink-0" />
                          <span>Connexion Administration & KDS</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
