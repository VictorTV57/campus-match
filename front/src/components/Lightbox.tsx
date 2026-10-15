import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n/useI18n'

/** Photo en plein écran : ← → pour naviguer, Échap ou clic hors photo pour fermer. */
export function Lightbox({
  images,
  start,
  onClose,
}: {
  images: string[]
  start: number
  onClose: () => void
}) {
  const { t } = useI18n()
  const [index, setIndex] = useState(start)
  const count = images.length
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Capturé avant la page swipe : ← → ne doivent pas swiper ici.
      e.stopPropagation()
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count)
      else if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [count, onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-full rounded-lg object-contain"
      />
      {count > 1 && (
        <>
          <NavButton side="left" onClick={() => go(-1)} />
          <NavButton side="right" onClick={() => go(1)} />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80 tabular-nums">
            {index + 1} / {count}
          </span>
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('photos.close')}
        className="absolute top-3 right-3 rounded-full bg-white/10 px-3 py-1 text-2xl text-white hover:bg-white/20"
      >
        ×
      </button>
    </div>,
    document.body,
  )
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      aria-label={t(side === 'left' ? 'photos.previous' : 'photos.next')}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-2 text-3xl text-white hover:bg-white/20 ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  )
}
