import { createContext } from 'react'
import type { PublicUser } from '../api/types'

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: PublicUser }

export interface AuthContextValue {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  register: (input: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<void>
  /** Connexion anonyme : compte invité, données non sauvegardées. */
  loginAsGuest: () => Promise<void>
  /** Pour un invité, supprime aussi son compte et ses données. */
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
