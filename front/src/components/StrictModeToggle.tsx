import { useEffect, useState } from 'react'
import { preferencesApi } from '../api/endpoints'
import type { Preferences, PreferencesInput } from '../api/types'
import { useI18n } from '../i18n/useI18n'
import { ErrorBox, Switch } from './ui'

/** Repasse des préférences lues en corps de PUT (champs null omis). */
function toInput(p: Preferences, strictMode: boolean): PreferencesInput {
  const { scoring, notes } = p
  return {
    scoring: {
      countries: scoring.countries,
      languages: scoring.languages,
      studyFields: scoring.studyFields,
      ...(scoring.budgetMax !== null && { budgetMax: scoring.budgetMax }),
      ...(scoring.userGpa !== null && { userGpa: scoring.userGpa }),
      ...(scoring.semesterPref !== null && { semesterPref: scoring.semesterPref }),
      wantsDoubleDiploma: scoring.wantsDoubleDiploma,
      ...(scoring.erasmusPref !== null && { erasmusPref: scoring.erasmusPref }),
      ...(scoring.minSpots !== null && { minSpots: scoring.minSpots }),
      strictMode,
    },
    notes: Object.fromEntries(
      Object.entries(notes).filter((entry): entry is [string, string] => entry[1] !== null),
    ),
  }
}

/**
 * Interrupteur du mode strict, enregistré dans les préférences (PUT complet :
 * le back n'expose pas de modification partielle).
 */
export function StrictModeToggle({ onChanged }: { onChanged: () => void }) {
  const { t } = useI18n()
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    // 404 (pas de préférences) : la page affiche déjà son propre message.
    preferencesApi.get().then(setPrefs, () => setPrefs(null))
  }, [])

  if (prefs === null) return null

  const toggle = async (strictMode: boolean) => {
    setSaving(true)
    setError(null)
    try {
      setPrefs(await preferencesApi.save(toInput(prefs, strictMode)))
      onChanged()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2" title={t('strict.help')}>
        <Switch
          checked={prefs.scoring.strictMode}
          onChange={toggle}
          disabled={saving}
          label={t('strict.label')}
        />
        <span className="text-xs text-slate-500">
          {t(prefs.scoring.strictMode ? 'strict.on' : 'strict.off')}
        </span>
      </div>
      <ErrorBox error={error} />
    </div>
  )
}
