import { Navigate, Outlet, useLocation } from 'react-router'
import { Spinner } from '../components/ui'
import { useAuth } from './useAuth'

/** Routes réservées aux utilisateurs connectés ; sinon redirige au login. */
export function RequireAuth() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') {
    return <Spinner className="mt-24" />
  }
  if (state.status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Login / inscription : inutile si déjà connecté. */
export function RedirectIfAuthenticated() {
  const { state } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (state.status === 'authenticated') {
    return <Navigate to={from} replace />
  }
  return <Outlet />
}
