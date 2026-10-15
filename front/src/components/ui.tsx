import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ApiError } from '../api/client'
import { useI18n } from '../i18n/useI18n'

export function Spinner({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <div className={`flex justify-center ${className}`} role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      <span className="sr-only">{t('ui.loading')}</span>
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
  secondary:
    'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
  danger: 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

/** Affiche une erreur d'API (liste des messages de validation du back). */
export function ErrorBox({ error }: { error: unknown }) {
  if (error === null || error === undefined) return null
  const messages =
    error instanceof ApiError
      ? error.messages
      : [error instanceof Error ? error.message : String(error)]
  return (
    <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <ul className="list-inside list-disc">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      {children}
    </div>
  )
}

/** Astérisque rouge des champs obligatoires (expliqué aux lecteurs d'écran). */
export function RequiredMark() {
  const { t } = useI18n()
  return (
    <>
      <span className="ml-0.5 text-red-600" aria-hidden>
        *
      </span>
      <span className="sr-only"> ({t('ui.required')})</span>
    </>
  )
}

export function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
      {hint !== undefined && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border-0 bg-white px-3 py-2 text-slate-900 ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none'

export function Tag({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'indigo' | 'emerald' | 'amber' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

/**
 * Groupe de contrôles (pastilles, boutons) : un <fieldset>, pas un <label>,
 * car un clic sur un label activerait le premier bouton qu'il contient.
 */
export function Fieldset({
  legend,
  hint,
  required = false,
  children,
}: {
  legend: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 text-sm font-medium text-slate-700">
        {legend}
        {required && <RequiredMark />}
      </legend>
      {children}
      {hint !== undefined && <span className="block text-xs text-slate-500">{hint}</span>}
    </fieldset>
  )
}

/** Interrupteur on/off accessible (role="switch"). */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 disabled:opacity-50"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
      {label}
    </button>
  )
}
