import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { session } from '../api/client'
import { authApi } from '../api/endpoints'
import type { AuthResponse } from '../api/types'
import { AuthContext, type AuthContextValue, type AuthState } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    session.canResume() ? { status: 'loading' } : { status: 'anonymous' },
  )

  // Reprise de session au chargement : le client régénère l'access token
  // depuis le refresh token stocké, puis /auth/me confirme l'utilisateur.
  useEffect(() => {
    session.onExpired(() => setState({ status: 'anonymous' }))
    if (!session.canResume()) return
    authApi
      .me()
      .then((user) => setState({ status: 'authenticated', user }))
      .catch(() => {
        session.clear()
        setState({ status: 'anonymous' })
      })
  }, [])

  const start = useCallback((res: AuthResponse) => {
    session.start(res, res.user.isGuest)
    setState({ status: 'authenticated', user: res.user })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login: async (email, password) => start(await authApi.login(email, password)),
      register: async (input) => start(await authApi.register(input)),
      loginAsGuest: async () => start(await authApi.guest()),
      // Compte normal : pas de route de révocation côté back, le refresh token
      // reste valide jusqu'à expiration mais n'est plus stocké. Invité : son
      // compte et ses données sont supprimés (sinon, purge sous 24 h).
      logout: async () => {
        if (state.status === 'authenticated' && state.user.isGuest) {
          await authApi.deleteGuest().catch(() => undefined)
        }
        session.clear()
        setState({ status: 'anonymous' })
      },
    }),
    [state, start],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
