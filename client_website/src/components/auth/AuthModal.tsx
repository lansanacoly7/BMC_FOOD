import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, KeyRound, Lock, LogOut, Phone, User, X } from 'lucide-react'
import { API_BASE_URL } from '../../services/api'
import { loadProfile } from '../../services/clientData'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export interface ClientUser {
  name: string
  phone: string
  email?: string
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: ClientUser) => void
  onLogout?: () => void
}

type View = 'login' | 'register' | 'otp'

const USER_STORAGE_KEY = 'bmc_client_user'
const PHONE_PATTERN = /^(?:\+221|00221)?(?:7[05678]|33)\d{7}$/
const MIN_PASSWORD_LENGTH = 4

/**
 * Code de vérification SIMULÉ : aucun SMS n'est envoyé tant qu'il n'y a pas de service SMS.
 * À remplacer par une vraie vérification côté serveur avant la mise en production.
 */
const SIMULATED_OTP = '454647'

/** Adresse de l'application cuisine (administration), pour les comptes du personnel. */
const ADMIN_URL: string | undefined = import.meta.env.VITE_ADMIN_URL ?? (import.meta.env.DEV ? 'http://localhost:5174/' : undefined)

const inputClass =
  'h-12 w-full rounded-lg border border-white/10 bg-zinc-950 pl-11 pr-3 text-base text-white placeholder-zinc-500 outline-none transition-colors focus:border-bmc-gold sm:text-sm'

function Field({
  id,
  label,
  icon: Icon,
  right,
  children,
}: {
  id: string
  label: string
  icon: typeof User
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-200">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        {children}
        {right}
      </div>
    </div>
  )
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-zinc-400 transition-colors hover:text-white"
    >
      {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
    </button>
  )
}

const primaryButton =
  'inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-bmc-gold text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50'

const linkButton = 'cursor-pointer font-semibold text-bmc-gold underline-offset-4 transition-colors hover:text-white hover:underline'

/**
 * Connexion et inscription du client : connexion unique (téléphone + mot de passe), inscription avec
 * confirmation du mot de passe puis code OTP, déconnexion avec confirmation.
 * Les comptes du personnel sont reconnus par l'API (jeton staff) et orientés vers l'application cuisine.
 */
export function AuthModal({ isOpen, onClose, onSuccess, onLogout }: AuthModalProps) {
  const baseId = useId()
  const [view, setView] = useState<View>('login')

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [registerName, setRegisterName] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirm, setRegisterConfirm] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [staffRecognized, setStaffRecognized] = useState(false)

  // À chaque ouverture : on relit le compte (il a pu changer depuis la page profil) et on repart d'un écran propre
  useEffect(() => {
    if (!isOpen) return
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY)
      setCurrentUser(saved ? (JSON.parse(saved) as ClientUser) : null)
    } catch {
      setCurrentUser(null)
    }
    setError(null)
    setSuccess(null)
    setOtpCode('')
    setStaffRecognized(false)
    setView('login')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmLogout) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, confirmLogout])

  const finishLogin = (user: ClientUser, message: string) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } catch {
      /* le compte reste valable pour la session */
    }
    setCurrentUser(user)
    setSuccess(message)
    onSuccess?.(user)
    window.setTimeout(onClose, 1200)
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const cleanId = identifier.trim()
    if (!cleanId || !password) {
      setError('Renseignez votre numéro de téléphone et votre mot de passe.')
      return
    }

    setIsLoading(true)

    // 1. Compte du personnel : l'API vérifie les identifiants (jeton staff, débit limité)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username: cleanId, password }),
      })
      if (response.ok) {
        setIsLoading(false)
        setStaffRecognized(true)
        setSuccess('Compte du personnel reconnu. Connectez-vous depuis l’application cuisine.')
        return
      }
    } catch {
      /* serveur injoignable : on poursuit avec la connexion client */
    }

    // 2. Compte client : le numéro doit être un numéro sénégalais valide
    const cleanPhone = cleanId.replace(/\s+/g, '')
    if (!PHONE_PATTERN.test(cleanPhone)) {
      setIsLoading(false)
      setError('Identifiant ou mot de passe incorrect. Pour un compte client, saisissez votre numéro (ex. 77 856 13 13).')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setIsLoading(false)
      setError(`Le mot de passe doit comporter au moins ${MIN_PASSWORD_LENGTH} caractères.`)
      return
    }

    window.setTimeout(() => {
      setIsLoading(false)
      // On reprend le nom déjà enregistré pour ce numéro, sinon un nom générique
      let name = 'Client BMC'
      try {
        const saved = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) ?? 'null') as ClientUser | null
        const profile = loadProfile()
        if (saved?.phone === cleanPhone && saved.name) name = saved.name
        else if (profile.firstName || profile.lastName) name = `${profile.firstName} ${profile.lastName}`.trim()
      } catch {
        /* nom générique */
      }
      finishLogin({ name, phone: cleanPhone }, 'Connexion réussie. Bienvenue chez BMC Food.')
    }, 400)
  }

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!registerName.trim()) {
      setError('Indiquez votre prénom et votre nom.')
      return
    }
    if (!PHONE_PATTERN.test(registerPhone.replace(/\s+/g, ''))) {
      setError('Numéro invalide (ex. 77 856 13 13).')
      return
    }
    if (registerPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit comporter au moins ${MIN_PASSWORD_LENGTH} caractères.`)
      return
    }
    if (registerPassword !== registerConfirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      setView('otp')
    }, 400)
  }

  const handleVerifyOtp = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (otpCode.trim() !== SIMULATED_OTP) {
      setError('Code incorrect. Vérifiez les 6 chiffres.')
      return
    }

    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      finishLogin(
        { name: registerName.trim(), phone: registerPhone.replace(/\s+/g, '') },
        'Numéro validé. Votre compte est créé.',
      )
    }, 400)
  }

  const handleConfirmLogout = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY)
    } catch {
      /* rien à effacer */
    }
    setCurrentUser(null)
    setConfirmLogout(false)
    setIdentifier('')
    setPassword('')
    onLogout?.()
    onClose()
  }

  const title = currentUser ? 'Mon compte' : view === 'login' ? 'Connexion' : view === 'register' ? 'Inscription' : 'Vérification'
  const subtitle = currentUser
    ? 'Vos coordonnées sont reprises à chaque commande.'
    : view === 'login'
      ? 'Connectez-vous avec votre numéro de téléphone.'
      : view === 'register'
        ? 'Créez votre compte en quelques secondes.'
        : `Entrez le code reçu au +221 ${registerPhone}.`

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/75"
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${baseId}-title`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la fenêtre"
                className="absolute right-3 top-3 grid size-11 cursor-pointer place-items-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" aria-hidden="true" />
              </button>

              <div className="mb-6 text-center">
                <img src="/images/brand/logo.png" alt="BMC Food" width={64} height={64} className="mx-auto h-16 w-auto object-contain" />
                <h2 id={`${baseId}-title`} className="mt-3 font-display text-2xl font-bold text-white">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
              </div>

              {success && (
                <p role="status" className="mb-4 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                  <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{success}</span>
                </p>
              )}
              {error && (
                <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}

              {staffRecognized ? (
                ADMIN_URL ? (
                  <a href={ADMIN_URL} className={primaryButton}>
                    Ouvrir l’application cuisine
                  </a>
                ) : null
              ) : currentUser && !success ? (
                /* Déjà connecté */
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
                    <p className="font-display text-lg font-bold text-white">{currentUser.name}</p>
                    <p className="text-sm tabular-nums text-zinc-400">{currentUser.phone}</p>
                  </div>
                  <button type="button" onClick={onClose} className={primaryButton}>
                    Continuer mes commandes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(true)}
                    className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500/40 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Se déconnecter
                  </button>
                </div>
              ) : view === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                  <Field id={`${baseId}-identifier`} label="Numéro de téléphone" icon={Phone}>
                    <input
                      id={`${baseId}-identifier`}
                      type="text"
                      inputMode="tel"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="77 856 13 13"
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    id={`${baseId}-password`}
                    label="Mot de passe"
                    icon={Lock}
                    right={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                  >
                    <input
                      id={`${baseId}-password`}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pr-12`}
                    />
                  </Field>

                  <button type="submit" disabled={isLoading} className={primaryButton}>
                    {isLoading ? <span className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> : 'Se connecter'}
                  </button>

                  <p className="border-t border-white/10 pt-4 text-center text-sm text-zinc-400">
                    Pas encore de compte ?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setView('register')
                        setError(null)
                      }}
                      className={linkButton}
                    >
                      Créer un compte
                    </button>
                  </p>
                </form>
              ) : view === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                  <Field id={`${baseId}-name`} label="Prénom et nom" icon={User}>
                    <input
                      id={`${baseId}-name`}
                      type="text"
                      autoComplete="name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Amadou Diallo"
                      className={inputClass}
                    />
                  </Field>
                  <Field id={`${baseId}-phone`} label="Numéro de téléphone" icon={Phone}>
                    <input
                      id={`${baseId}-phone`}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="77 856 13 13"
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    id={`${baseId}-rpassword`}
                    label="Mot de passe"
                    icon={Lock}
                    right={<PasswordToggle shown={showRegisterPassword} onToggle={() => setShowRegisterPassword((v) => !v)} />}
                  >
                    <input
                      id={`${baseId}-rpassword`}
                      type={showRegisterPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pr-12`}
                    />
                  </Field>
                  <Field
                    id={`${baseId}-rconfirm`}
                    label="Confirmer le mot de passe"
                    icon={Lock}
                    right={<PasswordToggle shown={showRegisterConfirm} onToggle={() => setShowRegisterConfirm((v) => !v)} />}
                  >
                    <input
                      id={`${baseId}-rconfirm`}
                      type={showRegisterConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={registerConfirm}
                      onChange={(e) => setRegisterConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pr-12`}
                    />
                  </Field>

                  <button type="submit" disabled={isLoading} className={primaryButton}>
                    {isLoading ? <span className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> : 'Continuer'}
                  </button>

                  <p className="border-t border-white/10 pt-4 text-center text-sm text-zinc-400">
                    Déjà un compte ?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setView('login')
                        setError(null)
                      }}
                      className={linkButton}
                    >
                      Se connecter
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
                  <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
                    <p className="text-sm text-zinc-300">Un code de vérification est envoyé par SMS.</p>
                    {/* Vérification simulée : le code est affiché tant qu'il n'y a pas de service SMS */}
                    <p className="mt-2 text-sm text-zinc-400">
                      Code de test :{' '}
                      <button
                        type="button"
                        onClick={() => setOtpCode(SIMULATED_OTP)}
                        className="cursor-pointer font-mono font-bold text-bmc-gold underline-offset-4 hover:underline"
                        title="Toucher pour le saisir automatiquement"
                      >
                        {SIMULATED_OTP}
                      </button>
                    </p>
                  </div>

                  <Field id={`${baseId}-otp`} label="Code à 6 chiffres" icon={KeyRound}>
                    <input
                      id={`${baseId}-otp`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className={`${inputClass} text-center font-mono text-lg tracking-widest`}
                    />
                  </Field>

                  <button type="submit" disabled={isLoading} className={primaryButton}>
                    {isLoading ? <span className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> : 'Valider mon inscription'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setView('register')
                      setError(null)
                    }}
                    className="inline-flex h-11 cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Modifier mes informations
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Se déconnecter ?"
        description="Vous serez déconnecté de votre compte BMC Food sur cet appareil."
        confirmLabel="Oui, me déconnecter"
        cancelLabel="Rester connecté"
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  )
}
