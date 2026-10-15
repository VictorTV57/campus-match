import { Link } from 'react-router'
import { useI18n } from '../i18n/useI18n'
import { Card } from './ui'

/** Affiché quand le back répond 404 faute de préférences enregistrées. */
export function NeedPreferences({ title }: { title: string }) {
  const { t } = useI18n()
  return (
    <Card className="mx-auto max-w-md space-y-3 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-slate-500">
        {t('needPrefs.text')}
      </p>
      <Link
        to="/preferences"
        className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        {t('needPrefs.button')}
      </Link>
    </Card>
  )
}
