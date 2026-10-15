import { CRITERIA, type ScoreResult } from '../api/types'
import { useI18n } from '../i18n/useI18n'
import { CRITERION_KEYS } from './format'

const EXCLUSION_KEYS = {
  'no-preference': 'breakdown.noPreference',
  'no-data': 'breakdown.noData',
} as const

/** Détail du score : une barre par critère pris en compte, les autres grisés. */
export function ScoreBreakdown({
  breakdown,
  compact = false,
}: {
  breakdown: ScoreResult['breakdown']
  compact?: boolean
}) {
  const { t } = useI18n()
  return (
    <ul className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {CRITERIA.map((criterion) => {
        const result = breakdown[criterion]
        return (
          <li key={criterion} className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 text-slate-600">{t(CRITERION_KEYS[criterion])}</span>
            {result.included ? (
              <>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${barColor(result.score)}`}
                    style={{ width: `${Math.round(result.score * 100)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right tabular-nums text-slate-700">
                  {Math.round(result.score * 100)} %
                  {!compact && <span className="text-slate-400"> ×{result.weight}</span>}
                </span>
              </>
            ) : (
              <span className="flex-1 italic text-slate-400">
                {t('breakdown.excluded', { reason: t(EXCLUSION_KEYS[result.reason]) })}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function barColor(score: number): string {
  if (score >= 0.75) return 'bg-emerald-500'
  if (score >= 0.4) return 'bg-amber-400'
  return 'bg-rose-400'
}

export function ScoreBadge({ score }: { score: number | null }) {
  const pct = score === null ? null : Math.round(score * 100)
  const tone =
    pct === null
      ? 'bg-slate-100 text-slate-500'
      : pct >= 75
        ? 'bg-emerald-100 text-emerald-800'
        : pct >= 40
          ? 'bg-amber-100 text-amber-800'
          : 'bg-rose-100 text-rose-800'
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${tone}`}>
      {pct === null ? '—' : `${pct} %`}
    </span>
  )
}
