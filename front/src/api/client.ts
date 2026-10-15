// Client HTTP : ajoute l'access token, et le renouvelle via le refresh token
// quand le back répond 401 (access token expiré, 15 min par défaut).
//
// - access token : en mémoire seulement (perdu au rechargement, on le
//   régénère depuis le refresh token) ;
// - refresh token : localStorage, pour rester connecté entre les visites ;
//   sessionStorage pour un invité (connexion anonyme), effacé à la fermeture
//   de l'onglet. Compromis acceptable pour un outil perso ; un cookie
//   httpOnly serait plus sûr face au XSS.

import { tCurrent } from '../i18n/i18n'

const API_PREFIX = '/api'
const REFRESH_KEY = 'campusmatch.refreshToken'

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null
let onSessionExpired: (() => void) | null = null

export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages.join(' · ') || tCurrent('ui.httpError', { status }))
    this.name = 'ApiError'
    this.status = status
    this.messages = messages
  }
}

function readRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export const session = {
  /** `tabOnly` : session limitée à l'onglet (invité). */
  start(tokens: { accessToken: string; refreshToken: string }, tabOnly = false): void {
    // Retire un éventuel token resté dans l'autre stockage (invité ↔ compte).
    session.clear()
    accessToken = tokens.accessToken
    try {
      const storage = tabOnly ? sessionStorage : localStorage
      storage.setItem(REFRESH_KEY, tokens.refreshToken)
    } catch {
      // stockage indisponible (navigation privée…) : session limitée à l'onglet
    }
  },
  clear(): void {
    accessToken = null
    try {
      localStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
    } catch {
      // rien à nettoyer
    }
  },
  canResume(): boolean {
    return accessToken !== null || readRefreshToken() !== null
  },
  /** Appelé quand le refresh token est refusé : l'app renvoie au login. */
  onExpired(handler: () => void): void {
    onSessionExpired = handler
  },
}

/**
 * Un seul refresh à la fois : si plusieurs requêtes reçoivent un 401 en
 * même temps, elles attendent toutes le même renouvellement.
 */
function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    const refreshToken = readRefreshToken()
    if (refreshToken === null) return false
    try {
      const res = await fetch(`${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return false
      const body = (await res.json()) as { accessToken: string }
      accessToken = body.accessToken
      return true
    } catch {
      return false
    }
  })().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  /** false pour login / register (pas de token à envoyer). */
  auth?: boolean
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await authorizedFetch(path, options)
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

/**
 * Télécharge un fichier renvoyé par le back (export CSV / Excel) : passe
 * par le même renouvellement de token que `api`, puis déclenche
 * l'enregistrement dans le navigateur sous le nom donné par le back.
 */
export async function download(path: string, fallbackName: string): Promise<void> {
  const res = await authorizedFetch(path)
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName
  const url = URL.createObjectURL(await res.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Requête avec access token, renouvelé une fois sur 401 ; lève ApiError si !ok. */
async function authorizedFetch(
  path: string,
  { method = 'GET', body, auth = true }: RequestOptions = {},
): Promise<Response> {
  if (auth && accessToken === null) {
    await refreshAccessToken()
  }

  const send = () =>
    fetch(`${API_PREFIX}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(auth && accessToken !== null && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  let res = await send()

  if (res.status === 401 && auth) {
    if (await refreshAccessToken()) {
      res = await send()
    }
    if (res.status === 401) {
      session.clear()
      onSessionExpired?.()
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessages(res))
  }
  return res
}

/** Erreurs NestJS : { message: string | string[], error, statusCode }. */
async function readErrorMessages(res: Response): Promise<string[]> {
  try {
    const body = (await res.json()) as { message?: unknown }
    if (Array.isArray(body.message)) return body.message.map(String)
    if (typeof body.message === 'string') return [body.message]
  } catch {
    // corps non JSON (proxy, back arrêté…)
  }
  if (res.status === 502 || res.status === 504) {
    return [tCurrent('ui.serverDown')]
  }
  return [tCurrent('ui.httpError', { status: res.status })]
}
