import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import iconUrl from '../assets/icon.svg'
import { useAuth } from '../auth/useAuth'
import type { MessageKey } from '../i18n/messages'
import { useI18n } from '../i18n/useI18n'
import { LanguageSwitch } from './LanguageSwitch'

const LINKS: { to: string; label: MessageKey }[] = [
  { to: '/', label: 'nav.home' },
  { to: '/top8', label: 'nav.top8' },
  { to: '/swipe', label: 'nav.swipe' },
  { to: '/preferences', label: 'nav.preferences' },
  { to: '/help', label: 'nav.help' },
]

export function Layout() {
  const { state, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const isGuest = state.status === 'authenticated' && state.user.isGuest

  /** Un invité perd ses données en se déconnectant : on demande confirmation. */
  const leave = async (then?: string) => {
    if (isGuest && !window.confirm(t('guest.logout.confirm'))) return
    await logout()
    if (then !== undefined) navigate(then)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <Link to="/" className="mr-2 flex shrink-0 items-center gap-2" aria-label="CampusMatch">
            <img src={iconUrl} alt="" className="h-8 w-8" />
            <span className="hidden text-lg font-extrabold tracking-tight sm:inline">
              <span className="text-[#14213D]">Campus</span>
              <span className="text-[#E8463A]">Match</span>
            </span>
          </Link>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {t(label)}
              </NavLink>
            ))}
          </nav>
          <LanguageSwitch />
          {state.status === 'authenticated' && (
            <span className="hidden text-sm text-slate-500 sm:inline">
              {isGuest ? `👤 ${t('auth.guest.name')}` : state.user.firstName}
            </span>
          )}
          <button
            type="button"
            onClick={() => void leave()}
            className="rounded-lg px-2 py-1.5 text-sm whitespace-nowrap text-slate-500 hover:bg-slate-100"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>
      {isGuest && (
        <div role="status" className="border-b border-amber-200 bg-amber-50 text-amber-900">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
            <span aria-hidden>⚠️</span>
            <span className="flex-1">{t('guest.banner')}</span>
            <button
              type="button"
              onClick={() => void leave('/register')}
              className="font-medium whitespace-nowrap underline underline-offset-2 hover:text-amber-700"
            >
              {t('guest.banner.cta')}
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
