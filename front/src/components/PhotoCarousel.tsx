import { useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/useI18n'
import { Lightbox } from './Lightbox'

/**
 * Carrousel des photos d'une université : flèches, points, clic pour
 * agrandir. Les éléments interactifs sont des <button> : la carte de swipe
 * ignore les glissés qui démarrent dessus.
 */
export function PhotoCarousel({
  images,
  className = 'h-56',
  children,
}: {
  images: string[]
  /** Hauteur (classes Tailwind). */
  className?: string
  /** Surimpression (ex. badge de score). */
  children?: ReactNode
}) {
  const { t } = useI18n()
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const count = images.length
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count)

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-100 to-slate-200 ${className}`}>
      {count > 0 && (
        <button type="button" onClick={() => setZoomed(true)} className="h-full w-full" title={t('photos.enlarge')}>
          <img src={images[index]} alt="" draggable={false} className="h-full w-full object-cover" />
        </button>
      )}

      {count > 1 && (
        <>
          <ArrowButton label={t('photos.previous')} onClick={() => go(-1)} className="left-2">
            ‹
          </ArrowButton>
          <ArrowButton label={t('photos.next')} onClick={() => go(1)} className="right-2">
            ›
          </ArrowButton>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={t('photos.number', { n: i + 1 })}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}

      {children}
      {zoomed && <Lightbox images={images} start={index} onClose={() => setZoomed(false)} />}
    </div>
  )
}

function ArrowButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className: string
  children: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-xl text-white hover:bg-black/55 ${className}`}
    >
      {children}
    </button>
  )
}
