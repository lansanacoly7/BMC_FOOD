import React, { useState } from 'react'
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
          setErrorMessage('Identifiant ou mot de passe incorrect.')
        }
      } else {
        setErrorMessage(error?.message || 'Connexion impossible. Réessayez dans un instant.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass =
    'w-full h-11 px-3.5 rounded-lg bg-[#0F1216] border border-[#1F242B] text-sm text-white placeholder-[#5F6875] focus:outline-none focus:border-[#3A414B]'

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0B0D10]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/images/brand/logo.png" alt="BMC Food" className="h-12 w-auto object-contain" />
          <p className="text-sm text-[#8A93A0] mt-3">Espace administration</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <p className="text-sm text-[#F28B82]" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm text-[#C4CAD3]">
              Identifiant
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm text-[#C4CAD3]">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-[#8A93A0] hover:text-white cursor-pointer"
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-2 rounded-lg bg-[#F5B301] text-[#0B0D10] text-sm font-semibold hover:bg-[#FFC21A] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
