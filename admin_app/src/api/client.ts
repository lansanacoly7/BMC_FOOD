/**
 * Client HTTP isolé pour l'API Django REST Framework (DRF)
 * Gère automatiquement :
 * - Les en-têtes Authorization: Token <token>
 * - Le jeton CSRF (cookies / X-CSRFToken)
 * - Le timeout réseau et la détection hors-ligne
 * - L'activation conditionnelle du mode Mock (VITE_USE_MOCK=true)
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const TOKEN_KEY = 'bmc_admin_token'
const USER_KEY = 'bmc_admin_username'
export const DEV_DEFAULT_TOKEN = '5950ee892e2812d22579dfb9527874765235f85e'

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Ignore storage errors
  }
}

export function getAuthUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY)
  } catch {
    return null
  }
}

export function setAuthUser(username: string): void {
  try {
    localStorage.setItem(USER_KEY, username)
  } catch {
    // Ignore storage errors
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // Ignore storage errors
  }
}


/** Récupère le cookie CSRF si présent dans le navigateur */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;)\s*csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(message: string, status: number, payload: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

/**
 * Exécute une requête HTTP typée vers Django DRF
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 8000, headers: customHeaders, ...restOptions } = options

  const headers = new Headers(customHeaders)
  headers.set('Accept', 'application/json')
  if (restOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Jeton DRF Staff
  const token = getAuthToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Token ${token}`)
  }

  // Jeton CSRF Django si disponible
  const csrf = getCsrfToken()
  if (csrf && !headers.has('X-CSRFToken')) {
    headers.set('X-CSRFToken', csrf)
  }

  // Gestion du timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const signal = restOptions.signal
    ? (anySignal([restOptions.signal, controller.signal]))
    : controller.signal

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL}${cleanEndpoint}`

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      signal,
    })
    clearTimeout(timeoutId)

    if (response.status === 204) {
      return null as T
    }

    const payload: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ApiError(
        `Erreur API ${response.status} (${response.statusText})`,
        response.status,
        payload,
      )
    }

    return payload as T
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Délai d’attente dépassé (Serveur Django non réactif)', 408)
    }
    throw new ApiError(
      `Connexion impossible au serveur backend (${(error as Error).message})`,
      0,
    )
  }
}

/** Combine plusieurs AbortSignal */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort()
      return controller.signal
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}

/** Connexion administrateur par identifiants (POST /api/auth/token/). */
export async function loginAdmin(
  username: string,
  password: string,
): Promise<{ token: string; username: string }> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    if (!username.trim() || !password.trim()) {
      throw new ApiError('Veuillez renseigner un identifiant et un mot de passe.', 400)
    }
    const token = DEV_DEFAULT_TOKEN
    setAuthToken(token)
    setAuthUser(username)
    return { token, username }
  }

  try {
    const res = await apiClient<{ success?: boolean; token: string; username: string }>('/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    if (res?.token) {
      setAuthToken(res.token)
      setAuthUser(res.username || username)
    }
    return res
  } catch (error) {
    if (import.meta.env.DEV && (error as ApiError)?.status === 0) {
      // Si Django est indisponible en local en mode dev
      const token = DEV_DEFAULT_TOKEN
      setAuthToken(token)
      setAuthUser(username || 'admin')
      return { token, username: username || 'admin' }
    }
    throw error
  }
}

