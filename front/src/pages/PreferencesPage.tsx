import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { preferencesApi, universitiesApi } from '../api/endpoints'
import {
  ERASMUS_PREFS,
  SEMESTER_PREFS,
  type ErasmusPref,
  type PersonalNotes,
  type Preferences,
  type PreferencesInput,
  type SemesterPref,
  type UniversityFilters,
} from '../api/types'
import { ChipSelect } from '../components/ChipSelect'
import { CountryLabel, LanguageLabel } from '../components/CountryFlag'
import { countryName, languageName } from '../components/displayNames'
import { SpecializationLabel } from '../components/SpecializationLabel'
import { useI18n } from '../i18n/useI18n'
import type { MessageKey } from '../i18n/messages'
import { Button, Card, ErrorBox, Field, Fieldset, Spinner, Switch, inputClass } from '../components/ui'

/** État du formulaire : tout en string pour les champs texte/nombre. */
interface FormState {
  countries: string[]
  languages: string[]
  studyFields: string[]
  budgetMax: string
  userGpa: string
  semesterPref: SemesterPref
  wantsDoubleDiploma: boolean
  erasmusPref: ErasmusPref
  minSpots: string
  strictMode: boolean
  notes: Record<keyof PersonalNotes, string>
}

const EMPTY_FORM: FormState = {
  countries: [],
  languages: [],
  studyFields: [],
  budgetMax: '',
  userGpa: '',
  semesterPref: 'any',
  wantsDoubleDiploma: false,
  erasmusPref: 'any',
  minSpots: '',
  strictMode: false,
  notes: { foodPref: '', socialPref: '', climatePref: '', housingType: '' },
}

const NOTE_FIELDS: { key: keyof PersonalNotes; label: MessageKey; placeholder: MessageKey }[] = [
  { key: 'foodPref', label: 'prefs.notes.food', placeholder: 'prefs.notes.food.placeholder' },
  { key: 'socialPref', label: 'prefs.notes.social', placeholder: 'prefs.notes.social.placeholder' },
  { key: 'climatePref', label: 'prefs.notes.climate', placeholder: 'prefs.notes.climate.placeholder' },
  { key: 'housingType', label: 'prefs.notes.housing', placeholder: 'prefs.notes.housing.placeholder' },
]

function fromPreferences(p: Preferences): FormState {
  return {
    countries: p.scoring.countries,
    languages: p.scoring.languages,
    studyFields: p.scoring.studyFields,
    budgetMax: p.scoring.budgetMax === null ? '' : String(p.scoring.budgetMax),
    userGpa: p.scoring.userGpa === null ? '' : String(p.scoring.userGpa),
    semesterPref: p.scoring.semesterPref ?? 'any',
    wantsDoubleDiploma: p.scoring.wantsDoubleDiploma,
    erasmusPref: p.scoring.erasmusPref ?? 'any',
    minSpots: p.scoring.minSpots === null ? '' : String(p.scoring.minSpots),
    strictMode: p.scoring.strictMode,
    notes: {
      foodPref: p.notes.foodPref ?? '',
      socialPref: p.notes.socialPref ?? '',
      climatePref: p.notes.climatePref ?? '',
      housingType: p.notes.housingType ?? '',
    },
  }
}

/** Champs vides omis : le back les remet à null (sémantique PUT). */
function toInput(form: FormState): PreferencesInput {
  const notes = Object.fromEntries(
    Object.entries(form.notes)
      .map(([k, v]) => [k, v.trim()])
      .filter(([, v]) => v !== ''),
  ) as PreferencesInput['notes']
  return {
    scoring: {
      countries: form.countries,
      languages: form.languages,
      studyFields: form.studyFields,
      ...(form.budgetMax.trim() !== '' && { budgetMax: Number(form.budgetMax) }),
      ...(form.userGpa.trim() !== '' && { userGpa: Number(form.userGpa.replace(',', '.')) }),
      semesterPref: form.semesterPref,
      wantsDoubleDiploma: form.wantsDoubleDiploma,
      erasmusPref: form.erasmusPref,
      ...(form.minSpots.trim() !== '' && { minSpots: Number(form.minSpots) }),
      strictMode: form.strictMode,
    },
    notes,
  }
}

export function PreferencesPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<UniversityFilters | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isNew, setIsNew] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const prefs = preferencesApi.get().catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    })
    Promise.all([universitiesApi.filters(), prefs])
      .then(([f, p]) => {
        setFilters(f)
        if (p !== null) {
          setForm(fromPreferences(p))
          setIsNew(false)
        }
      })
      .catch(setLoadError)
  }, [])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    // Vérif rapide côté client ; le back reste juge (validation DTO).
    if (form.countries.length === 0 || form.languages.length === 0) {
      setSaveError(new Error(t('prefs.missingRequired')))
      return
    }
    setSaving(true)
    try {
      await preferencesApi.save(toInput(form))
      navigate(isNew ? '/swipe' : '/top8')
    } catch (err) {
      setSaveError(err)
      setSaving(false)
    }
  }

  if (loadError !== null) return <ErrorBox error={loadError} />
  if (filters === null) return <Spinner className="mt-16" />

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('prefs.title')}</h1>
        <p className="text-sm text-slate-500">
          {t(isNew ? 'prefs.introNew' : 'prefs.introEdit')}
        </p>
      </div>

      <Card className="space-y-5">
        <div>
          <h2 className="font-semibold">{t('prefs.scoring.title')}</h2>
          <p className="text-xs text-slate-500">{t('prefs.scoring.help')}</p>
        </div>

        <Fieldset legend={t('prefs.countries')} required>
          <ChipSelect
            options={filters.countries}
            selected={form.countries}
            onChange={(v) => set('countries', v)}
            searchPlaceholder={t('prefs.countries.search')}
            renderOption={(country) => <CountryLabel country={country} />}
            searchText={(country) => countryName(lang, country)}
          />
        </Fieldset>

        <Fieldset legend={t('prefs.languages')} required>
          <ChipSelect
            options={filters.languages}
            selected={form.languages}
            onChange={(v) => set('languages', v)}
            renderOption={(language) => <LanguageLabel language={language} />}
            searchText={(language) => languageName(lang, language)}
          />
        </Fieldset>

        <Fieldset legend={t('prefs.studyFields')} hint={t('prefs.studyFields.hint')}>
          <ChipSelect
            options={filters.specializations}
            selected={form.studyFields}
            onChange={(v) => set('studyFields', v)}
            searchPlaceholder={t('prefs.studyFields.search')}
            renderOption={(s) => <SpecializationLabel specialization={s} />}
          />
        </Fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('prefs.budget')} hint={t('prefs.budget.hint')}>
            <input
              type="number"
              min={0}
              step={100}
              inputMode="numeric"
              value={form.budgetMax}
              onChange={(e) => set('budgetMax', e.target.value)}
              placeholder={t('prefs.budget.placeholder')}
              className={inputClass}
            />
          </Field>
          <Field label={t('prefs.gpa')} hint={t('prefs.gpa.hint')}>
            <input
              type="number"
              min={0}
              max={4}
              step={0.01}
              inputMode="decimal"
              value={form.userGpa}
              onChange={(e) => set('userGpa', e.target.value)}
              placeholder={t('prefs.gpa.placeholder')}
              className={inputClass}
            />
          </Field>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">{t('prefs.semester')}</legend>
          <div className="flex flex-wrap gap-2">
            {SEMESTER_PREFS.map((pref) => (
              <label
                key={pref}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm ring-1 ${
                  form.semesterPref === pref
                    ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                    : 'text-slate-700 ring-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="semesterPref"
                  value={pref}
                  checked={form.semesterPref === pref}
                  onChange={() => set('semesterPref', pref)}
                  className="sr-only"
                />
                {t(`semesterPref.${pref}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Fieldset legend={t('prefs.erasmus')} hint={t('prefs.erasmus.hint')}>
            <div className="flex flex-wrap gap-2">
              {ERASMUS_PREFS.map((pref) => (
                <button
                  key={pref}
                  type="button"
                  aria-pressed={form.erasmusPref === pref}
                  onClick={() => set('erasmusPref', pref)}
                  className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${
                    form.erasmusPref === pref
                      ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                      : 'text-slate-700 ring-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {t(`erasmusPref.${pref}`)}
                </button>
              ))}
            </div>
          </Fieldset>
          <Field label={t('prefs.minSpots')} hint={t('prefs.minSpots.hint')}>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={form.minSpots}
              onChange={(e) => set('minSpots', e.target.value)}
              placeholder={t('prefs.minSpots.placeholder')}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="space-y-1">
          <Switch
            checked={form.wantsDoubleDiploma}
            onChange={(v) => set('wantsDoubleDiploma', v)}
            label={t('prefs.doubleDiploma')}
          />
          <p className="text-xs text-slate-500">{t('prefs.doubleDiploma.help')}</p>
        </div>

        <div className="space-y-1 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <Switch
            checked={form.strictMode}
            onChange={(v) => set('strictMode', v)}
            label={t('strict.label')}
          />
          <p className="text-xs text-slate-500">{t('strict.help')}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">{t('prefs.notes.title')}</h2>
          <p className="text-xs text-slate-500">{t('prefs.notes.help')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {NOTE_FIELDS.map(({ key, label, placeholder }) => (
            <Field key={key} label={t(label)}>
              <input
                value={form.notes[key]}
                onChange={(e) => set('notes', { ...form.notes, [key]: e.target.value })}
                placeholder={t(placeholder)}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </Card>

      <ErrorBox error={saveError} />
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {t(saving ? 'prefs.saving' : isNew ? 'prefs.saveAndSwipe' : 'prefs.save')}
        </Button>
      </div>
    </form>
  )
}
