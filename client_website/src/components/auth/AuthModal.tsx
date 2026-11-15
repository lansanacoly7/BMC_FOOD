import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Check, Eye, EyeOff, Lock, LogOut, Phone, User, X } from 'lucide-react'
import { API_BASE_URL } from '../../services/api'
import { clearClientToken, loadProfile, saveProfile, setClientToken, syncCustomerAccount } from '../../services/clientData'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

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

type View = 'login' | 'register'

const USER_STORAGE_KEY = 'bmc_client_user'
const PHONE_PATTERN = /^(?:\+221|00221)?(?:7[05678]|33)\d{7}$/
const MIN_PASSWORD_LENGTH = 4

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

  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [staffRecognized, setStaffRecognized] = useState(false)

  // À chaque ouverture : on relit le compte (il a pu changer depuis la page profil) et on repart d'un écran propre
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      try {
        const saved = localStorage.getItem(USER_STORAGE_KEY)
        setCurrentUser(saved ? (JSON.parse(saved) as ClientUser) : null)
      } catch {
        setCurrentUser(null)
      }
      setError(null)
      setSuccess(null)
      setStaffRecognized(false)
      setView('login')
    }
  }

  // Page figée tant que la fenêtre est ouverte : on ne fait défiler que la fenêtre elle-même.
  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmLogout) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, confirmLogout])

  const finishLogin = (user: ClientUser, message: string, token?: string, address?: string) => {
    if (token) {
      setClientToken(token)
    }
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } catch {
      /* le compte reste valable pour la session */
    }
    const existingProfile = loadProfile()
    const [first = '', ...rest] = user.name.trim().split(/\s+/)
    saveProfile({
      ...existingProfile,
      firstName: existingProfile.firstName || first,
      lastName: existingProfile.lastName || rest.join(' '),
      address: existingProfile.address || address || '',
      contactName: user.name,
      contactPhone: user.phone,
    })
    if (token) {
      void syncCustomerAccount()
    }
    setCurrentUser(user)
    setSuccess(message)
    onSuccess?.(user)
    window.setTimeout(onClose, 900)
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const cleanId = identifier.trim()
    if (!cleanId || !password) {
      setError('Renseignez votre numéro de téléphone et votre mot de passe.')
      return
    }

    const cleanPhone = cleanId.replace(/\s+/g, '')
    const isPhone = PHONE_PATTERN.test(cleanPhone)

    setIsLoading(true)

    try {
      // Identifiant non-téléphonique : vérification d'un compte du personnel
      if (!isPhone) {
        const staffRes = await fetch(`${API_BASE_URL}/auth/token/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ username: cleanId, password }),
        })
        if (staffRes.ok) {
          setStaffRecognized(true)
          setSuccess('Compte du personnel reconnu. Connectez-vous depuis l’application cuisine.')
          return
        }
        setError('Identifiant ou mot de passe incorrect. Pour un compte client, saisissez votre numéro (ex. 77 856 13 13).')
        return
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Le mot de passe doit comporter au moins ${MIN_PASSWORD_LENGTH} caractères.`)
        return
      }

      const response = await fetch(`${API_BASE_URL}/auth/customer/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password }),
      })
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean
        token?: string
        message?: string
        error?: string
        user?: { name: string; phone: string; address?: string }
      } | null

      if (!response.ok || !payload?.success || !payload.token || !payload.user) {
        setError(payload?.error || payload?.message || 'Numéro de téléphone ou mot de passe incorrect.')
        return
      }

      finishLogin(
        { name: payload.user.name, phone: payload.user.phone },
        payload.message || 'Connexion réussie. Bienvenue chez BMC Food.',
        payload.token,
        payload.user.address,
      )
    } catch {
      setError('Impossible de joindre le serveur BMC Food. Réessayez dans un instant.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const cleanName = registerName.trim()
    const cleanPhone = registerPhone.replace(/\s+/g, '')

    if (!cleanName) {
      setError('Indiquez votre prénom et votre nom.')
      return
    }
    if (!PHONE_PATTERN.test(cleanPhone)) {
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
    try {
      const response = await fetch(`${API_BASE_URL}/auth/customer/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          password: registerPassword,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean
        token?: string
        message?: string
        error?: string
        user?: { name: string; phone: string; address?: string }
      } | null

      if (!response.ok || !payload?.success || !payload.token || !payload.user) {
        setError(payload?.error || payload?.message || 'Impossible de créer le compte.')
        return
      }

      finishLogin(
        { name: payload.user.name, phone: payload.user.phone },
        payload.message || 'Compte créé avec succès. Bienvenue chez BMC Food !',
        payload.token,
        payload.user.address,
      )
    } catch {
      setError('Impossible de joindre le serveur BMC Food. Réessayez dans un instant.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmLogout = () => {
    clearClientToken()
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

  const title = currentUser ? 'Mon compte' : view === 'login' ? 'Connexion' : 'Inscription'
  const subtitle = currentUser
    ? 'Vos coordonnées sont reprises à chaque commande.'
    : view === 'login'
      ? 'Connectez-vous avec votre numéro de téléphone.'
      : 'Créez votre compte client BMC Food en quelques secondes.'

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
              className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8"
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
              ) : (
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
                    {isLoading ? <span className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> : 'Créer mon compte'}
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
