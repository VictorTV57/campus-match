import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import logoUrl from '../assets/logo.svg'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { Button, Card, ErrorBox, Field, inputClass } from '../components/ui'
import { useI18n } from '../i18n/useI18n'

function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1>
            <img src={logoUrl} alt="CampusMatch" className="mx-auto h-12 w-auto" />
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('app.tagline')}</p>
        </div>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{title}</h2>
          {children}
        </Card>
        <GuestAccess />
      </div>
    </div>
  )
}

/** Connexion anonyme : compte invité temporaire, avec l'avertissement. */
function GuestAccess() {
  const { loginAsGuest } = useAuth()
  const { t } = useI18n()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const start = async () => {
    setPending(true)
    setError(null)
    try {
      await loginAsGuest()
    } catch (err) {
      setError(err)
      setPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate-400 uppercase">
        <span className="h-px flex-1 bg-slate-200" />
        {t('auth.guest.or')}
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <Button variant="secondary" className="w-full" disabled={pending} onClick={start}>
        👤 {t(pending ? 'auth.guest.pending' : 'auth.guest.button')}
      </Button>
      <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
        <span aria-hidden>⚠️</span>
        {t('auth.guest.warning')}
      </p>
      <ErrorBox error={error} />
    </div>
  )
}

/** Soumission commune : état d'envoi + erreur affichée. La redirection
 * après succès est gérée par RedirectIfAuthenticated. */
function useSubmit(action: () => Promise<void>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err)
      setPending(false)
    }
  }
  return { pending, error, onSubmit }
}

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { pending, error, onSubmit } = useSubmit(() => login(email.trim(), password))

  return (
    <AuthShell title={t('auth.login.title')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t('auth.email')} required>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t('auth.password')} required>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        <ErrorBox error={error} />
        <Button type="submit" disabled={pending} className="w-full">
          {t(pending ? 'auth.login.pending' : 'auth.login.submit')}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          {t('auth.login.toRegister')}
        </Link>
      </p>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const { t } = useI18n()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))
  const { pending, error, onSubmit } = useSubmit(() =>
    register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
    }),
  )

  return (
    <AuthShell title={t('auth.register.title')}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('auth.register.firstName')} required>
            <input required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} className={inputClass} />
          </Field>
          <Field label={t('auth.register.lastName')} required>
            <input required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} className={inputClass} />
          </Field>
        </div>
        <Field label={t('auth.email')} required>
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} className={inputClass} />
        </Field>
        <Field label={t('auth.password')} hint={t('auth.register.passwordHint')} required>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            className={inputClass}
          />
        </Field>
        <ErrorBox error={error} />
        <Button type="submit" disabled={pending} className="w-full">
          {t(pending ? 'auth.register.pending' : 'auth.register.submit')}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          {t('auth.register.toLogin')}
        </Link>
      </p>
    </AuthShell>
  )
}
