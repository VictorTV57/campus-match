import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { rankingApi, swipesApi } from '../api/endpoints'
import type { DeckCard, SwipeAction } from '../api/types'
import { NeedPreferences } from '../components/NeedPreferences'
import { StrictModeToggle } from '../components/StrictModeToggle'
import { SwipeCard } from '../components/SwipeCard'
import { Button, Card, ErrorBox, Spinner } from '../components/ui'
import { useI18n } from '../i18n/useI18n'

const BATCH_SIZE = 10
/** On recharge le paquet quand il reste si peu de cartes en local. */
const REFILL_BELOW = 3
const EXIT_ANIMATION_MS = 220

export function SwipePage() {
  const { t } = useI18n()
  const [queue, setQueue] = useState<DeckCard[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [history, setHistory] = useState<{ card: DeckCard; action: SwipeAction }[]>([])
  const [leaving, setLeaving] = useState<SwipeAction | null>(null)
  const [error, setError] = useState<unknown>(null)

  // Les écritures sont chaînées : un rechargement du paquet attend qu'elles
  // soient toutes parties, sinon le back renverrait des cartes déjà swipées.
  const writes = useRef<Promise<unknown>>(Promise.resolve())
  const fetching = useRef(false)

  const enqueueWrite = (write: () => Promise<unknown>) => {
    writes.current = writes.current.then(write).catch(setError)
  }

  const refill = useCallback(async () => {
    if (fetching.current) return
    fetching.current = true
    try {
      await writes.current
      const deck = await rankingApi.deck(BATCH_SIZE)
      setQueue((current) => {
        const known = new Set(current.map((c) => c.university.id))
        return [...current, ...deck.cards.filter((c) => !known.has(c.university.id))]
      })
      setRemaining(deck.remaining)
    } catch (err) {
      setError(err)
    } finally {
      fetching.current = false
    }
  }, [])

  useEffect(() => {
    void refill()
  }, [refill])

  // File vide alors que le back annonce des cartes restantes (rechargement
  // concurrent, bascule du mode strict…) : on redemande un lot.
  const starved = queue.length === 0 && remaining !== null && remaining > 0
  useEffect(() => {
    if (starved) void refill()
  }, [starved, refill])

  const decide = useCallback(
    (action: SwipeAction) => {
      const card = queue[0]
      if (card === undefined || leaving !== null) return
      setLeaving(action)
      enqueueWrite(() => swipesApi.set(card.university.id, action))
      window.setTimeout(() => {
        setLeaving(null)
        setQueue((q) => q.slice(1))
        setHistory((h) => [...h.slice(-19), { card, action }])
        setRemaining((r) => (r === null ? r : r - 1))
        if (queue.length - 1 < REFILL_BELOW) void refill()
      }, EXIT_ANIMATION_MS)
    },
    [queue, leaving, refill],
  )

  const undo = useCallback(() => {
    const last = history[history.length - 1]
    if (last === undefined || leaving !== null) return
    enqueueWrite(() => swipesApi.remove(last.card.university.id))
    setHistory((h) => h.slice(0, -1))
    setQueue((q) => [last.card, ...q.filter((c) => c.university.id !== last.card.university.id)])
    setRemaining((r) => (r === null ? r : r + 1))
  }, [history, leaving])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select') !== null) return
      const actions: Record<string, () => void> = {
        ArrowLeft: () => decide('pass'),
        ArrowRight: () => decide('like'),
        ArrowUp: () => decide('superlike'),
        Backspace: undo,
        z: undo,
      }
      const run = actions[e.key]
      if (run !== undefined) {
        e.preventDefault()
        run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [decide, undo])

  const restart = async () => {
    if (!window.confirm(t('swipePage.restartConfirm'))) return
    try {
      await writes.current
      await swipesApi.clear()
      setQueue([])
      setHistory([])
      await refill()
    } catch (err) {
      setError(err)
    }
  }

  // Le filtre a changé : les cartes déjà chargées ne sont peut-être plus valables.
  const reloadDeck = () => {
    setQueue([])
    void refill()
  }

  if (error instanceof ApiError && error.status === 404 && remaining === null) {
    return <NeedPreferences title={t('swipePage.nothing')} />
  }
  if (remaining === null) {
    return error !== null ? <ErrorBox error={error} /> : <Spinner className="mt-16" />
  }

  const [current, next] = queue

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('swipePage.title')}</h1>
        <span className="text-sm text-slate-500 tabular-nums">
          {t('swipePage.remaining', { count: remaining })}
        </span>
      </div>

      <StrictModeToggle onChanged={reloadDeck} />
      <ErrorBox error={error} />

      {current === undefined && starved ? (
        <Spinner className="mt-16" />
      ) : current === undefined ? (
        <Card className="space-y-3 text-center">
          <p className="text-lg font-semibold">{t('swipePage.done')}</p>
          <p className="text-sm text-slate-500">{t('swipePage.doneHint')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/top8"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('swipePage.seeTop8')}
            </Link>
            {history.length > 0 && (
              <Button variant="secondary" onClick={undo}>
                {t('swipePage.undoLast')}
              </Button>
            )}
            <Button variant="danger" onClick={restart}>
              {t('swipePage.restart')}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative h-[600px]">
            {next !== undefined && (
              <div className="absolute inset-0 translate-y-3 scale-95 opacity-60" aria-hidden>
                <SwipeCard key={next.university.id} card={next} leaving={null} onDecide={() => {}} />
              </div>
            )}
            <div className="absolute inset-0">
              <SwipeCard key={current.university.id} card={current} leaving={leaving} onDecide={decide} />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <RoundButton label={t('swipePage.undo')} onClick={undo} disabled={history.length === 0} className="h-11 w-11 text-slate-500">
              ↶
            </RoundButton>
            <RoundButton label={t('swipePage.pass')} onClick={() => decide('pass')} className="h-14 w-14 text-2xl text-rose-500">
              ✕
            </RoundButton>
            <RoundButton label={t('swipePage.superlike')} onClick={() => decide('superlike')} className="h-12 w-12 text-xl text-amber-500">
              ★
            </RoundButton>
            <RoundButton label={t('swipePage.like')} onClick={() => decide('like')} className="h-14 w-14 text-2xl text-emerald-500">
              ♥
            </RoundButton>
          </div>
          <p className="text-center text-xs text-slate-400">
            {t('swipePage.keys')}
          </p>
        </>
      )}
    </div>
  )
}

function RoundButton({
  label,
  className,
  children,
  ...props
}: {
  label: string
  className: string
  children: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
