/**
 * Worker Cloudflare frontal unifié pour BMC FOOD (Static Assets + Proxy API).
 * Sert les fichiers statiques React via env.ASSETS (SPA) et relaie /api/* ainsi que /media/*
 * vers l'origine Django configurée via la variable d'environnement BACKEND_ORIGIN.
 */

const FORWARDED_PREFIXES = ['/api', '/media']

function shouldProxy(pathname) {
  return FORWARDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (!shouldProxy(url.pathname)) {
      return env.ASSETS.fetch(request)
    }

    const backendOrigin = (env.BACKEND_ORIGIN || '').trim().replace(/\/+$/, '')
    if (!backendOrigin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Serveur API backend non raccordé (variable BACKEND_ORIGIN manquante).",
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      )
    }

    const upstreamUrl = new URL(`${url.pathname}${url.search}`, `${backendOrigin}/`)
    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.delete('cf-connecting-ip')
    headers.delete('cf-ipcountry')
    headers.delete('cf-ray')
    headers.delete('cf-visitor')

    const clientIp = request.headers.get('CF-Connecting-IP')
    if (clientIp) {
      headers.set('X-Forwarded-For', clientIp)
    }
    headers.set('X-Forwarded-Host', url.host)
    headers.set('X-Forwarded-Proto', 'https')

    try {
      const upstreamRequest = new Request(upstreamUrl.toString(), {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'manual',
      })
      return await fetch(upstreamRequest)
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Le serveur API backend est temporairement injoignable.',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      )
    }
  },
}
