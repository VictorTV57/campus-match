import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { exportApi, rankingApi, swipesApi } from '../api/endpoints'
import type { RankedUniversity } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { CountryLabel, LanguageLabel } from '../components/CountryFlag'
import { formatExtraCharge, semesterLabel } from '../components/format'
import { PhotoCarousel } from '../components/PhotoCarousel'
import { ScoreBadge } from '../components/ScoreBreakdown'
import { Button, Card, ErrorBox, Spinner, Tag } from '../components/ui'
import { useApiData } from '../hooks/useApiData'
import type { MessageKey } from '../i18n/messages'
import { useI18n } from '../i18n/useI18n'

const MYA_URL = 'https://mya.epitech.eu'
const PRIMARY = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700'
const SECONDARY =
  'rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50'

export function HomePage() {
  const { t } = useI18n()
  const { state } = useAuth()
  const firstName =
    state.status !== 'authenticated'
      ? ''
      : state.user.isGuest
        ? t('auth.guest.name')
        : state.user.firstName

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('home.hello', { name: firstName })}</h1>
        <p className="text-sm text-slate-500">{t('home.intro')}</p>
      </div>

      <Top1Card />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActionTile to="/swipe" icon="🃏" title="home.action.swipe" desc="home.action.swipe.desc" />
        <ActionTile to="/top8" icon="🏆" title="home.action.top8" desc="home.action.top8.desc" />
        <ActionTile to="/preferences" icon="⚙️" title="home.action.preferences" desc="home.action.preferences.desc" />
        <ActionTile href={MYA_URL} icon="🌍" title="home.action.mya" desc="home.action.mya.desc" />
        <ActionTile to="/help" icon="❓" title="home.action.help" desc="home.action.help.desc" />
      </div>

      <Disclaimer />
      <ExportCard />
    </div>
  )
}

/**
 * Première université du top 8, affichée seulement après au moins un swipe.
 * Sinon (pas de préférences, aucun swipe, ou tout retiré par des « pass »),
 * pas de Top 1 et des liens pour y remédier.
 */
function Top1Card() {
  const { t, lang } = useI18n()
  const { data, error, loading } = useApiData(() =>
    Promise.all([rankingApi.top8(), swipesApi.list()]),
  )
  const noPreferences = error instanceof ApiError && error.status === 404
  const [top8, swipes] = data ?? [[], []]
  const noSwipe = !noPreferences && swipes.length === 0
  const top1: RankedUniversity | undefined = noSwipe ? undefined : top8[0]

  if (loading) return <Spinner className="py-10" />
  if (error !== null && !noPreferences) return <ErrorBox error={error} />

  if (top1 === undefined) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl" aria-hidden>
          🥇
        </p>
        <h2 className="text-lg font-semibold">{t('home.top1.empty.title')}</h2>
        <p className="text-sm text-slate-500">
          {t(noSwipe ? 'home.top1.noSwipe.text' : 'home.top1.empty.text')}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {/* Bouton principal : l'étape qui manque (swiper si les préférences sont prêtes). */}
          {!noPreferences && (
            <Link to="/swipe" className={noSwipe ? PRIMARY : SECONDARY}>
              {t('home.action.swipe')}
            </Link>
          )}
          <Link to="/preferences" className={noSwipe ? SECONDARY : PRIMARY}>
            {t('home.action.preferences')}
          </Link>
        </div>
      </Card>
    )
  }

  const uni = top1.university
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid sm:grid-cols-[2fr_3fr]">
        <PhotoCarousel images={uni.images} className="h-48 sm:h-full sm:min-h-56">
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-[#14213D] px-3 py-1 text-sm font-bold text-white shadow">
            🥇 {t('home.top1.title')}
          </span>
        </PhotoCarousel>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl leading-tight font-bold">{uni.name}</h2>
            <ScoreBadge score={top1.score} />
          </div>
          <p className="text-sm text-slate-500">
            <CountryLabel country={uni.country} /> · <LanguageLabel language={uni.language} />
          </p>
          <div className="flex flex-wrap gap-1">
            <Tag>{semesterLabel(t, uni.semester)}</Tag>
            <Tag tone={uni.extraChargeEur === 0 ? 'emerald' : 'amber'}>
              {formatExtraCharge(t, lang, uni.extraChargeEur)}
            </Tag>
            {uni.doubleDiploma && <Tag tone="emerald">{t('uni.doubleDiploma')}</Tag>}
            {top1.strictMatch && <Tag tone="emerald">{t('uni.strictMatch')}</Tag>}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to={`/universities/${uni.id}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('home.top1.open')}
            </Link>
            <Link to="/top8" className="px-2 py-2 text-sm font-medium text-indigo-600 hover:underline">
              {t('home.top1.seeTop8')}
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ActionTile({
  to,
  href,
  icon,
  title,
  desc,
}: {
  to?: string
  href?: string
  icon: string
  title: MessageKey
  desc: MessageKey
}) {
  const { t } = useI18n()
  const className =
    'group flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-indigo-300'
  const content: ReactNode = (
    <>
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span>
        <span className="block font-semibold group-hover:text-indigo-700">
          {t(title)}
          {href !== undefined && <span aria-hidden> ↗</span>}
        </span>
        <span className="block text-sm text-slate-500">{t(desc)}</span>
      </span>
    </>
  )
  return href !== undefined ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link to={to ?? '/'} className={className}>
      {content}
    </Link>
  )
}

function Disclaimer() {
  const { t } = useI18n()
  return (
    <div role="note" className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
      <span className="text-xl" aria-hidden>
        ⚠️
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{t('home.disclaimer.title')}</p>
        <p>{t('home.disclaimer.text')}</p>
        <a
          href={MYA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-medium underline underline-offset-2 hover:text-amber-700"
        >
          {t('home.disclaimer.link')}
        </a>
      </div>
    </div>
  )
}

type ExportChoice = { kind: 'catalog' | 'swipes'; format: 'csv' | 'xlsx' }

function ExportCard() {
  const { t, lang } = useI18n()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)

  const run = async (choice: ExportChoice) => {
    const id = `${choice.kind}-${choice.format}`
    setPending(id)
    setError(null)
    try {
      await exportApi.universities({ ...choice, lang })
    } catch (err) {
      setError(err)
    } finally {
      setPending(null)
    }
  }

  const row = (kind: ExportChoice['kind'], label: MessageKey, hint: MessageKey) => (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{t(label)}</p>
        <p className="text-xs text-slate-500">{t(hint)}</p>
      </div>
      <div className="flex gap-2">
        {(['csv', 'xlsx'] as const).map((format) => (
          <Button
            key={format}
            variant="secondary"
            className="px-3 py-1.5"
            disabled={pending !== null}
            onClick={() => run({ kind, format })}
          >
            {pending === `${kind}-${format}` ? '…' : '⬇'} {t(format === 'csv' ? 'home.export.csv' : 'home.export.xlsx')}
          </Button>
        ))}
      </div>
    </div>
  )

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-semibold">📊 {t('home.export.title')}</h2>
        <p className="text-xs text-slate-500">{t('home.export.text')}</p>
      </div>
      {row('catalog', 'home.export.catalog', 'home.export.catalog.hint')}
      {row('swipes', 'home.export.swipes', 'home.export.swipes.hint')}
      <ErrorBox error={error} />
    </Card>
  )
}
