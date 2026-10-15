import { useNavigate, useParams } from 'react-router'
import { universitiesApi } from '../api/endpoints'
import { formatExtraCharge, locale, myaUniversityUrl, semesterLabel } from '../components/format'
import { useI18n } from '../i18n/useI18n'
import { CountryLabel, LanguageLabel } from '../components/CountryFlag'
import { PhotoCarousel } from '../components/PhotoCarousel'
import { SpecializationLabel } from '../components/SpecializationLabel'
import { ErrorBox, Spinner, Tag } from '../components/ui'
import { UniversitySections } from '../components/UniversitySections'
import { useApiData } from '../hooks/useApiData'

export function UniversityPage() {
  const { t, lang } = useI18n()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: uni, error } = useApiData(() => universitiesApi.get(id), id)

  if (error !== null) return <ErrorBox error={error} />
  if (uni === null) return <Spinner className="mt-16" />

  return (
    <article className="space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">
        {t('uni.back')}
      </button>

      {uni.images.length > 0 && (
        <PhotoCarousel images={uni.images} className="h-64 rounded-2xl sm:h-80" />
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{uni.name}</h1>
          <a
            href={myaUniversityUrl(uni.myaId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
          >
            {t('uni.openOnMya')} <span aria-hidden>↗</span>
          </a>
        </div>
        <p className="text-slate-500">
          <CountryLabel country={uni.country} /> · <LanguageLabel language={uni.language} />
        </p>
        <div className="flex flex-wrap gap-1">
          <Tag>{semesterLabel(t, uni.semester)}</Tag>
          <Tag tone={uni.extraChargeEur === 0 ? 'emerald' : 'amber'}>{formatExtraCharge(t, lang, uni.extraChargeEur)}</Tag>
          <Tag>{uni.gpaMin === null ? t('uni.noGpaMin') : t('uni.gpaMin', { gpa: uni.gpaMin })}</Tag>
          <Tag>{t('uni.spots', { count: uni.spots })}</Tag>
          {uni.erasmus && <Tag tone="emerald">Erasmus+</Tag>}
          {uni.doubleDiploma && <Tag tone="emerald">{t('uni.doubleDiploma')}</Tag>}
          {!uni.active && <Tag tone="amber">{t('uni.retired')}</Tag>}
        </div>
        {uni.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {uni.specializations.map((s) => (
              <Tag key={s} tone="indigo">
                <SpecializationLabel specialization={s} />
              </Tag>
            ))}
          </div>
        )}
      </div>

      <UniversitySections university={uni} />

      <p className="text-xs text-slate-400">
        <a
          href={myaUniversityUrl(uni.myaId)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-indigo-600 hover:underline"
        >
          {t('uni.source', {
            date: new Date(uni.sourceUpdatedAt).toLocaleDateString(locale(lang)),
          })}
        </a>
      </p>
    </article>
  )
}
