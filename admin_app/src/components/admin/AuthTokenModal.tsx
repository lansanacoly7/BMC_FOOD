import { KeyRound, Lock, LogIn, LogOut, ShieldCheck, User, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { clearAdminToken, getAdminToken, loginAdmin, setAdminToken } from '../../services/api'

interface AuthTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthChange: () => void
}

export function AuthTokenModal({ isOpen, onClose, onAuthChange }: AuthTokenModalProps) {
  const currentToken = getAdminToken()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [manualToken, setManualToken] = useState(currentToken ?? '')
  const [useManualToken, setUseManualToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (useManualToken) {
        if (!manualToken.trim()) throw new Error('Veuillez renseigner un jeton DRF valide.')
        setAdminToken(manualToken.trim())
      } else {
        if (!username || !password) throw new Error('Veuillez saisir votre nom d’utilisateur et mot de passe.')
        await loginAdmin(username, password)
      }
      onAuthChange()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur d’authentification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    clearAdminToken()
    setManualToken('')
    onAuthChange()
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 text-white shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-bmc-gold/15 text-bmc-gold border border-bmc-gold/30">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h3 id="auth-modal-title" className="font-display text-base font-extrabold text-white">
                  Connexion API Cuisine
                </h3>
                <p className="text-[11px] text-zinc-400">Jeton d’autorisation Django REST Framework</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {currentToken ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>Jeton actif enregistré</span>
                </p>
                <p className="font-mono text-[11px] break-all text-zinc-400 bg-black/40 p-2 rounded-lg mt-1.5 border border-white/5">
                  {currentToken}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  <span>Déconnexion</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300 font-medium">
                  {error}
                </div>
              )}

              {!useManualToken ? (
                <>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-zinc-300 block">Nom d'utilisateur</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        required
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 py-2.5 pl-9.5 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-bmc-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-zinc-300 block">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 py-2.5 pl-9.5 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-bmc-gold focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-zinc-300 block">Jeton DRF (Token)</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
                      required
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-2.5 pl-9.5 pr-3 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-bmc-gold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  type="button"
                  onClick={() => setUseManualToken(!useManualToken)}
                  className="text-bmc-gold hover:underline cursor-pointer"
                >
                  {useManualToken ? '← Se connecter avec identifiants' : 'Ou coller directement un token DRF →'}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-bmc-gold via-amber-400 to-amber-500 px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-black shadow-md shadow-bmc-gold/20 hover:brightness-110 active:scale-97 transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="size-3.5" />
                  <span>{isLoading ? 'Connexion…' : 'Connexion'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
