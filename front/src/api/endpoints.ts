import { api, download } from './client'
import type {
  AuthResponse,
  Deck,
  Preferences,
  PreferencesInput,
  PublicUser,
  RankedUniversity,
  SwipeAction,
  UniversityDetail,
  UniversityFilters,
} from './types'

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),
  register: (input: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) =>
    api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      auth: false,
    }),
  me: () => api<PublicUser>('/auth/me'),
  /** Connexion anonyme : compte invité temporaire. */
  guest: () => api<AuthResponse>('/auth/guest', { method: 'POST', auth: false }),
  /** Supprime le compte invité courant et ses données. */
  deleteGuest: () => api<void>('/auth/guest', { method: 'DELETE' }),
}

export const preferencesApi = {
  /** 404 (ApiError) si l'utilisateur n'a pas encore de préférences. */
  get: () => api<Preferences>('/preferences'),
  save: (input: PreferencesInput) =>
    api<Preferences>('/preferences', { method: 'PUT', body: input }),
}

export const universitiesApi = {
  filters: () => api<UniversityFilters>('/universities/filters'),
  get: (id: string) => api<UniversityDetail>(`/universities/${id}`),
}

export const rankingApi = {
  /** Filtres sous forme de paramètres (voir pages/top8Filters.ts) ; {} = aucun. */
  top8: (filters: Record<string, string> = {}) => {
    const query = new URLSearchParams(filters).toString()
    return api<RankedUniversity[]>(query === '' ? '/ranking/top8' : `/ranking/top8?${query}`)
  },
  deck: (limit = 10) => api<Deck>(`/ranking/deck?limit=${limit}`),
}

export const swipesApi = {
  list: () => api<{ universityId: string; action: SwipeAction; createdAt: string }[]>('/swipes'),
  set: (universityId: string, action: SwipeAction) =>
    api<unknown>(`/swipes/${universityId}`, {
      method: 'PUT',
      body: { action },
    }),
  remove: (universityId: string) =>
    api<void>(`/swipes/${universityId}`, { method: 'DELETE' }),
  clear: () => api<{ deleted: number }>('/swipes', { method: 'DELETE' }),
}

export const exportApi = {
  /**
   * catalog : toutes les universités, sans données perso ;
   * swipes : mes universités swipées, classées (colorées dans Excel).
   */
  universities: (options: {
    kind: 'catalog' | 'swipes'
    format: 'csv' | 'xlsx'
    lang: 'fr' | 'en'
  }) => {
    const query = new URLSearchParams(options)
    return download(`/export/universities?${query.toString()}`, `campusmatch.${options.format}`)
  },
}
