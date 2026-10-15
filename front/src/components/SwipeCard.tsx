import { useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router'
import type { DeckCard, SwipeAction } from '../api/types'
import { useI18n } from '../i18n/useI18n'
import { formatExtraCharge, semesterLabel } from './format'
import { CountryLabel, LanguageLabel } from './CountryFlag'
import { PhotoCarousel } from './PhotoCarousel'
import { toPlainText } from './richTextParser'
import { ScoreBadge, ScoreBreakdown } from './ScoreBreakdown'
import { SpecializationLabel } from './SpecializationLabel'
import { Tag } from './ui'
import { UniversitySections } from './UniversitySections'

/** Distance (px) à partir de laquelle un glissé vaut décision. */
const THRESHOLD = 110

function actionFor(x: number, y: number): SwipeAction | null {
  if (y < -THRESHOLD && Math.abs(y) > Math.abs(x)) return 'superlike'
  if (x > THRESHOLD) return 'like'
  if (x < -THRESHOLD) return 'pass'
  return null
}

/**
 * Direction dominante du glissé et intensité (0..1, 1 = seuil de décision),
 * pour teinter la carte avant même que le geste soit validé.
 */
function dragTint(x: number, y: number): { action: SwipeAction; strength: number } | null {
  const up = -y
  if (Math.abs(x) < 8 && up < 8) return null
  if (up > Math.abs(x)) return { action: 'superlike', strength: Math.min(up / THRESHOLD, 1) }
  return { action: x > 0 ? 'like' : 'pass', strength: Math.min(Math.abs(x) / THRESHOLD, 1) }
}

/** Couleur de la teinte et du contour : vert like, rouge pass, jaune super like. */
const TINTS: Record<SwipeAction, { overlay: string; ring: string }> = {
  like: { overlay: 'bg-emerald-500', ring: 'ring-emerald-500' },
  pass: { overlay: 'bg-rose-500', ring: 'ring-rose-500' },
  superlike: { overlay: 'bg-amber-400', ring: 'ring-amber-400' },
}

const EXIT_TRANSFORMS: Record<SwipeAction, string> = {
  like: 'translate(140%, 0) rotate(20deg)',
  pass: 'translate(-140%, 0) rotate(-20deg)',
  superlike: 'translate(0, -140%)',
}

export function SwipeCard({
  card,
  leaving,
  onDecide,
}: {
  card: DeckCard
  /** Action en cours d'animation de sortie, null sinon. */
  leaving: SwipeAction | null
  onDecide: (action: SwipeAction) => void
}) {
  const { t, lang } = useI18n()
  const uni = card.university
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  // Mode lecture : la carte défile au lieu de se glisser.
  const [expanded, setExpanded] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Laisser les liens, boutons et sections repliables cliquables.
    if (expanded || (e.target as HTMLElement).closest('a, button, summary') !== null) return
    start.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (start.current === null) return
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }
  const onPointerEnd = () => {
    if (start.current === null) return
    start.current = null
    const action = drag === null ? null : actionFor(drag.x, drag.y)
    setDrag(null)
    if (action !== null) onDecide(action)
  }

  const hint = drag === null ? null : actionFor(drag.x * 1.6, drag.y * 1.6)
  // Pendant la sortie, la teinte reste pleine sur l'action choisie.
  const tint =
    leaving !== null
      ? { action: leaving, strength: 1 }
      : drag === null
        ? null
        : dragTint(drag.x, drag.y)
  const transform =
    leaving !== null
      ? EXIT_TRANSFORMS[leaving]
      : drag !== null
        ? `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 20}deg)`
        : 'none'

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      style={{ transform }}
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg ${tint === null ? 'ring-1 ring-slate-200' : `ring-4 ${TINTS[tint.action].ring}`} ${
        drag === null ? 'transition-transform duration-200 ease-out' : ''
      } ${expanded ? '' : `touch-none select-none ${drag !== null ? 'cursor-grabbing' : 'cursor-grab'}`}`}
    >
      {tint !== null && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[5] ${TINTS[tint.action].overlay}`}
          style={{ opacity: tint.strength * 0.45 }}
        />
      )}
      {hint !== null && <DragHint action={hint} />}

      <PhotoCarousel images={uni.images} className={expanded ? 'h-40 shrink-0' : 'h-52 shrink-0'}>
        <div className="pointer-events-none absolute top-3 right-3">
          <ScoreBadge score={card.score} />
        </div>
      </PhotoCarousel>

      <div className={`flex-1 space-y-3 p-5 ${expanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <div>
          <h2 className="text-xl leading-tight font-bold">{uni.name}</h2>
          <p className="text-sm text-slate-500">
            <CountryLabel country={uni.country} /> · <LanguageLabel language={uni.language} />
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          <Tag>{semesterLabel(t, uni.semester)}</Tag>
          <Tag tone={uni.extraChargeEur === 0 ? 'emerald' : 'amber'}>
            {formatExtraCharge(t, lang, uni.extraChargeEur)}
          </Tag>
          {uni.gpaMin !== null && <Tag>{t('uni.gpaMin', { gpa: uni.gpaMin })}</Tag>}
          <Tag>{t('uni.spots', { count: uni.spots })}</Tag>
          {card.strictMatch && <Tag tone="emerald">{t('uni.strictMatch')}</Tag>}
          {uni.erasmus && <Tag tone="emerald">Erasmus+</Tag>}
          {uni.doubleDiploma && <Tag tone="emerald">{t('uni.doubleDiploma')}</Tag>}
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

        {expanded ? (
          <>
            <ScoreBreakdown breakdown={card.breakdown} />
            <UniversitySections university={uni} collapsible />
            <Link to={`/universities/${uni.id}`} className="inline-block text-sm font-medium text-indigo-600 hover:underline">
              {t('swipeCard.openPage')}
            </Link>
          </>
        ) : (
          <>
            <p className="line-clamp-3 text-sm whitespace-pre-line text-slate-600">
              {toPlainText(uni.overview)}
            </p>
            <ScoreBreakdown breakdown={card.breakdown} compact />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="shrink-0 border-t border-slate-100 bg-white py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
      >
        {t(expanded ? 'swipeCard.collapse' : 'swipeCard.expand')}
      </button>
    </div>
  )
}

const HINTS: Record<SwipeAction, { label: string; className: string }> = {
  like: { label: 'LIKE', className: 'left-6 rotate-[-12deg] bg-emerald-500 ring-emerald-600' },
  pass: { label: 'PASS', className: 'right-6 rotate-12 bg-rose-500 ring-rose-600' },
  superlike: { label: 'SUPER', className: 'left-1/2 -translate-x-1/2 bg-amber-400 ring-amber-500' },
}

function DragHint({ action }: { action: SwipeAction }) {
  const { label, className } = HINTS[action]
  return (
    <span
      className={`absolute top-8 z-10 rounded-lg px-3 py-1 text-2xl font-extrabold tracking-widest text-white shadow-lg ring-4 ${className}`}
    >
      {label}
    </span>
  )
}
