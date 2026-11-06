import React, { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { loginAdmin } from '../api/client'
import { Button, Field, TextInput } from '../components/ui/primitives'

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
    <div className="theme-light grid min-h-[100dvh] w-full bg-canvas text-left text-ink lg:grid-cols-[1.1fr_1fr]">
      {/* Panneau de marque : logo principal blanc et or sur fond noir */}
      <aside className="relative hidden overflow-hidden bg-bmc-black lg:block">
        <img
          src="/images/hero/tacos_signature_slate.webp"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bmc-black via-bmc-black/50 to-bmc-black/70" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <img src="/images/brand/logo.png" alt="BMC Food" className="-ml-8 -mt-8 size-44 object-contain" />
          <div>
            <p className="font-display text-4xl font-extrabold leading-tight text-white">
              Le goût du vrai plaisir.
            </p>
            <p className="mt-2 text-sm text-white/70">Dakar · Ouvert tous les jours de 11h à 02h</p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col">
        <div className="flex justify-center bg-bmc-black py-2 lg:hidden">
          <img src="/images/brand/logo.png" alt="BMC Food" className="size-24 object-contain" />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-6">
          <h1 className="font-display text-3xl font-extrabold">Connexion</h1>
          <p className="mt-1 text-sm text-ink-soft">Accédez à l’espace d’administration.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {errorMessage && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-bad-soft px-3 py-2.5 text-sm text-bad"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {errorMessage}
              </p>
            )}

            <Field label="Identifiant" htmlFor="username">
              <TextInput
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                className="h-11"
              />
            </Field>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-medium text-ink">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer text-[13px] font-medium text-bmc-orange-deep hover:underline"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <TextInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="!mt-6 w-full">
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
