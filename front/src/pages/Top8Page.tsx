import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { rankingApi, swipesApi, universitiesApi } from '../api/endpoints'
import type { RankedUniversity, SwipeAction, UniversityDetail } from '../api/types'
import { SWIPE_KEYS, formatExtraCharge, semesterLabel } from '../components/format'
import { CountryLabel, LanguageLabel } from '../components/CountryFlag'
import { useI18n } from '../i18n/useI18n'
import { NeedPreferences } from '../components/NeedPreferences'
import { StrictModeToggle } from '../components/StrictModeToggle'
import { Top8FiltersPanel } from '../components/Top8FiltersPanel'
import { PhotoCarousel } from '../components/PhotoCarousel'
import { ScoreBadge, ScoreBreakdown } from '../components/ScoreBreakdown'
import { Button, Card, ErrorBox, Spinner, Tag } from '../components/ui'
import { UniversitySections } from '../components/UniversitySections'
import { useApiData } from '../hooks/useApiData'
import {
  activeFilterCount,
  filtersFromParams,
  filtersToParams,
  type Top8Filters,
} from './top8Filters'

export function Top8Page() {
  const { t } = useI18n()
  // Filtres dans l'URL (?countries=Japan&maxCharge=3000…) : survivent au rechargement.
  const [params, setParams] = useSearchParams()
  const filters = filtersFromParams(params)
  const query = filtersToParams(filters)
  const setFilters = (next: Top8Filters) => setParams(filtersToParams(next), { replace: true })

  const { data, error, loading, reload } = useApiData(
    () => rankingApi.top8(query),
    new URLSearchParams(query).toString(),
  )

  if (error instanceof ApiError && error.status === 404) {
    return <NeedPreferences title={t('top8.noRanking')} />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('top8.title')}</h1>
          <p className="text-sm text-slate-500">{t('top8.intro')}</p>
        </div>
        <Link to="/swipe" className="text-sm font-medium text-indigo-600 hover:underline">
          {t('top8.refine')}
        </Link>
      </div>

      <Top8FiltersPanel filters={filters} onChange={setFilters} />
      <StrictModeToggle onChanged={reload} />

      <ErrorBox error={error} />
      {loading && data === null && <Spinner className="mt-16" />}

      {data !== null && data.length === 0 && (
        <Card className="text-center text-sm text-slate-500">
          {t(activeFilterCount(filters) > 0 ? 'top8.emptyFiltered' : 'top8.empty')} {t('top8.emptyStrictHint')}
        </Card>
      )}

      <ol className={`space-y-3 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {data?.map((item) => (
          <RankedCard key={item.university.id} item={item} onChanged={reload} />
        ))}
      </ol>
    </div>
  )
}

function RankedCard({ item, onChanged }: { item: RankedUniversity; onChanged: () => void }) {
  const { t, lang } = useI18n()
  const { university: uni } = item
  const [panel, setPanel] = useState<'score' | 'info' | null>(null)
  const [detail, setDetail] = useState<UniversityDetail | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setPending(true)
    setError(null)
    try {
      await action()
      after?.()
    } catch (err) {
      setError(err)
    } finally {
      setPending(false)
    }
  }

  const swipe = (action: SwipeAction | null) =>
    run(
      () => (action === null ? swipesApi.remove(uni.id) : swipesApi.set(uni.id, action)),
      onChanged,
    )

  const toggleInfo = () => {
    if (panel === 'info') return setPanel(null)
    setPanel('info')
    // Les sections texte ne sont pas dans le classement : chargées à la demande.
    if (detail === null) void run(async () => setDetail(await universitiesApi.get(uni.id)))
  }

  return (
    <li>
      <Card className="space-y-3">
        <div className="flex gap-4">
          <div className="flex w-8 shrink-0 items-start justify-center pt-1 text-2xl font-bold text-indigo-600">
            {item.rank}
          </div>
          {uni.images.length > 0 && (
            <PhotoCarousel images={uni.images} className="hidden h-28 w-40 shrink-0 rounded-lg sm:block" />
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/universities/${uni.id}`} className="font-semibold hover:text-indigo-600 hover:underline">
                {uni.name}
              </Link>
              <ScoreBadge score={item.score} />
            </div>
            <p className="text-sm text-slate-500">
              <CountryLabel country={uni.country} /> · <LanguageLabel language={uni.language} /> ·{' '}
              {semesterLabel(t, uni.semester)} · {formatExtraCharge(t, lang, uni.extraChargeEur)}
            </p>
            <div className="flex flex-wrap gap-1">
              {item.swipe !== null && (
                <Tag tone={item.swipe === 'superlike' ? 'amber' : 'indigo'}>{t(SWIPE_KEYS[item.swipe])}</Tag>
              )}
              {item.strictMatch && <Tag tone="emerald">{t('uni.strictMatch')}</Tag>}
              {uni.erasmus && <Tag tone="emerald">Erasmus+</Tag>}
              {uni.doubleDiploma && <Tag tone="emerald">{t('uni.doubleDiploma')}</Tag>}
              {uni.gpaMin !== null && <Tag>{t('uni.gpaMin', { gpa: uni.gpaMin })}</Tag>}
              <Tag>{t('uni.spots', { count: uni.spots })}</Tag>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => setPanel((p) => (p === 'score' ? null : 'score'))}
          >
            {panel === 'score' ? '▲' : '▼'} {t('top8.scoreDetail')}
          </Button>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={toggleInfo}>
            {panel === 'info' ? '▲' : '▼'} {t('top8.moreInfo')}
          </Button>
          <div className="ml-auto flex gap-1">
            {item.swipe !== 'superlike' && (
              <Button variant="ghost" className="px-2 py-1 text-xs" disabled={pending} onClick={() => swipe('superlike')}>
                {t('top8.superlike')}
              </Button>
            )}
            {item.swipe !== null && (
              <Button variant="ghost" className="px-2 py-1 text-xs" disabled={pending} onClick={() => swipe(null)}>
                {t('top8.undoSwipe')}
              </Button>
            )}
            <Button variant="ghost" className="px-2 py-1 text-xs text-rose-600" disabled={pending} onClick={() => swipe('pass')}>
              {t('top8.remove')}
            </Button>
          </div>
        </div>

        {panel === 'score' && <ScoreBreakdown breakdown={item.breakdown} />}
        {panel === 'info' &&
          (detail === null ? (
            pending && <Spinner />
          ) : (
            <div className="space-y-3">
              {detail.images.length > 0 && (
                <PhotoCarousel images={detail.images} className="h-48 rounded-xl sm:hidden" />
              )}
              <UniversitySections university={detail} collapsible />
            </div>
          ))}
        <ErrorBox error={error} />
      </Card>
    </li>
  )
}
