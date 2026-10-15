import { useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '../api/client'
import { preferencesApi, universitiesApi } from '../api/endpoints'
import { useApiData } from '../hooks/useApiData'
import { useI18n } from '../i18n/useI18n'
import {
  NO_FILTERS,
  SEMESTER_FILTERS,
  activeFilterCount,
  filtersFromPreferences,
  type SemesterFilter,
  type Top8Filters,
} from '../pages/top8Filters'
import { ChipSelect } from './ChipSelect'
import { CountryLabel, LanguageLabel } from './CountryFlag'
import { countryName, languageName } from './displayNames'
import { locale } from './format'
import { SpecializationLabel } from './SpecializationLabel'
import { Button, Card, ErrorBox, Field, Fieldset, Spinner, Switch, inputClass } from './ui'

/** Délai avant d'appliquer une saisie numérique (évite une requête par touche). */
const NUMBER_DEBOUNCE_MS = 500

export function Top8FiltersPanel({
  filters,
  onChange,
}: {
  filters: Top8Filters
  onChange: (next: Top8Filters) => void
}) {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [prefsError, setPrefsError] = useState<unknown>(null)
  const [loadingPrefs, setLoadingPrefs] = useState(false)
  const { data: options } = useApiData(universitiesApi.filters)
  const set = <K extends keyof Top8Filters>(key: K, value: Top8Filters[K]) =>
    onChange({ ...filters, [key]: value })
  const count = activeFilterCount(filters)

  const applyPreferences = async () => {
    setLoadingPrefs(true)
    setPrefsError(null)
    try {
      const prefs = await preferencesApi.get()
      onChange(filtersFromPreferences(prefs.scoring))
    } catch (err) {
      // 404 : la page affiche déjà l'invitation à remplir les préférences.
      if (!(err instanceof ApiError && err.status === 404)) setPrefsError(err)
    } finally {
      setLoadingPrefs(false)
    }
  }

  const euro = (amount: number) =>
    new Intl.NumberFormat(locale(lang), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" className="px-3 py-1.5" onClick={() => setOpen((o) => !o)}>
          {open ? '▲' : '▼'} {t('filters.title')}
          {count > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 text-xs text-white tabular-nums">{count}</span>
          )}
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={applyPreferences} disabled={loadingPrefs}>
          {t('filters.fromPrefs')}
        </Button>
        {count > 0 && (
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => onChange(NO_FILTERS)}>
            {t('filters.clear')}
          </Button>
        )}
      </div>

      {/* Résumé : un clic sur une pastille retire ce filtre. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {count === 0 && <span className="text-sm text-slate-500">{t('filters.none')}</span>}
        {filters.countries.map((c) => (
          <ActiveChip key={`c-${c}`} onRemove={() => set('countries', filters.countries.filter((x) => x !== c))}>
            <CountryLabel country={c} />
          </ActiveChip>
        ))}
        {filters.languages.map((l) => (
          <ActiveChip key={`l-${l}`} onRemove={() => set('languages', filters.languages.filter((x) => x !== l))}>
            <LanguageLabel language={l} />
          </ActiveChip>
        ))}
        {filters.specializations.map((s) => (
          <ActiveChip
            key={`s-${s}`}
            onRemove={() => set('specializations', filters.specializations.filter((x) => x !== s))}
          >
            <SpecializationLabel specialization={s} />
          </ActiveChip>
        ))}
        {filters.maxCharge !== null && (
          <ActiveChip onRemove={() => set('maxCharge', null)}>
            {t('filters.maxCharge.chip', { amount: euro(filters.maxCharge) })}
          </ActiveChip>
        )}
        {filters.gpa !== null && (
          <ActiveChip onRemove={() => set('gpa', null)}>{t('filters.gpa.chip', { gpa: filters.gpa })}</ActiveChip>
        )}
        {filters.semester !== null && (
          <ActiveChip onRemove={() => set('semester', null)}>{t(`semesterPref.${filters.semester}`)}</ActiveChip>
        )}
        {filters.doubleDiploma && (
          <ActiveChip onRemove={() => set('doubleDiploma', false)}>{t('filters.doubleDiploma')}</ActiveChip>
        )}
        {filters.erasmus !== null && (
          <ActiveChip onRemove={() => set('erasmus', null)}>
            {t(filters.erasmus ? 'filters.erasmus.chip.yes' : 'filters.erasmus.chip.no')}
          </ActiveChip>
        )}
        {filters.minSpots !== null && (
          <ActiveChip onRemove={() => set('minSpots', null)}>
            {t('filters.minSpots.chip', { count: filters.minSpots })}
          </ActiveChip>
        )}
      </div>
      <ErrorBox error={prefsError} />

      {open &&
        (options === null ? (
          <Spinner />
        ) : (
          <div className="space-y-5 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">{t('filters.help')}</p>

            <Fieldset legend={t('filters.countries')}>
              <ChipSelect
                options={options.countries}
                selected={filters.countries}
                onChange={(v) => set('countries', v)}
                searchPlaceholder={t('prefs.countries.search')}
                renderOption={(c) => <CountryLabel country={c} />}
                searchText={(c) => countryName(lang, c)}
              />
            </Fieldset>

            <Fieldset legend={t('filters.languages')}>
              <ChipSelect
                options={options.languages}
                selected={filters.languages}
                onChange={(v) => set('languages', v)}
                renderOption={(l) => <LanguageLabel language={l} />}
                searchText={(l) => languageName(lang, l)}
              />
            </Fieldset>

            <Fieldset legend={t('filters.specializations')}>
              <ChipSelect
                options={options.specializations}
                selected={filters.specializations}
                onChange={(v) => set('specializations', v)}
                searchPlaceholder={t('prefs.studyFields.search')}
                renderOption={(s) => <SpecializationLabel specialization={s} />}
              />
            </Fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('filters.maxCharge')} hint={t('filters.empty')}>
                <NumberFilterInput
                  value={filters.maxCharge}
                  onCommit={(v) => set('maxCharge', v === null ? null : Math.round(v))}
                  min={0}
                  step={100}
                  placeholder={t('prefs.budget.placeholder')}
                />
              </Field>
              <Field label={t('filters.gpa')} hint={t('filters.gpa.hint')}>
                <NumberFilterInput
                  value={filters.gpa}
                  onCommit={(v) => set('gpa', v)}
                  min={0}
                  max={4}
                  step={0.01}
                  placeholder={t('prefs.gpa.placeholder')}
                />
              </Field>
            </div>

            <Fieldset legend={t('filters.semester')}>
              <div className="flex flex-wrap gap-2">
                {([null, ...SEMESTER_FILTERS] as (SemesterFilter | null)[]).map((value) => (
                  <button
                    key={value ?? 'any'}
                    type="button"
                    aria-pressed={filters.semester === value}
                    onClick={() => set('semester', value)}
                    className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${
                      filters.semester === value
                        ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                        : 'text-slate-700 ring-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {value === null ? t('filters.semester.any') : t(`semesterPref.${value}`)}
                  </button>
                ))}
              </div>
            </Fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <Fieldset legend={t('filters.erasmus')}>
                <div className="flex flex-wrap gap-2">
                  {([null, true, false] as const).map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      aria-pressed={filters.erasmus === value}
                      onClick={() => set('erasmus', value)}
                      className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${
                        filters.erasmus === value
                          ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                          : 'text-slate-700 ring-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t(
                        value === null
                          ? 'filters.semester.any'
                          : value
                            ? 'filters.erasmus.yes'
                            : 'filters.erasmus.no',
                      )}
                    </button>
                  ))}
                </div>
              </Fieldset>
              <Field label={t('filters.minSpots')} hint={t('filters.minSpots.hint')}>
                <NumberFilterInput
                  value={filters.minSpots}
                  onCommit={(v) => set('minSpots', v === null ? null : Math.max(1, Math.round(v)))}
                  min={1}
                  step={1}
                  placeholder={t('filters.minSpots.placeholder')}
                />
              </Field>
            </div>

            <Switch
              checked={filters.doubleDiploma}
              onChange={(v) => set('doubleDiploma', v)}
              label={t('filters.doubleDiploma')}
            />
          </div>
        ))}
    </Card>
  )
}

function ActiveChip({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={onRemove}
      title={t('filters.remove')}
      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
    >
      {children}
      <span aria-hidden>×</span>
    </button>
  )
}

/**
 * Champ numérique appliqué après une pause de saisie (ou à la sortie du
 * champ). Valeur vide ou invalide = pas de filtre.
 */
function NumberFilterInput({
  value,
  onCommit,
  min,
  max,
  step,
  placeholder,
}: {
  value: number | null
  onCommit: (value: number | null) => void
  min: number
  max?: number
  step: number
  placeholder: string
}) {
  const [text, setText] = useState(value === null ? '' : String(value))

  // Valeur changée de l'extérieur (« Reprendre mes préférences », effacer…).
  useEffect(() => {
    setText(value === null ? '' : String(value))
  }, [value])

  const parsed = (): number | null => {
    if (text.trim() === '') return null
    const n = Number(text.replace(',', '.'))
    if (!Number.isFinite(n) || n < min || (max !== undefined && n > max)) return value
    return n
  }

  const commit = () => {
    const next = parsed()
    if (next !== value) onCommit(next)
  }

  useEffect(() => {
    const timer = window.setTimeout(commit, NUMBER_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  })

  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      placeholder={placeholder}
      className={inputClass}
    />
  )
}
