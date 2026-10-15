import { useMemo, useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { Lightbox } from './Lightbox'
import { parseRichText, type Inline } from './richTextParser'

/** Affiche une section de fiche université (format : voir richTextParser.ts). */
export function RichText({ source }: { source: string }) {
  const { t } = useI18n()
  const blocks = useMemo(() => parseRichText(source), [source])
  const images = blocks.flatMap((b) => (b.type === 'image' ? [b.src] : []))
  const [zoomed, setZoomed] = useState<number | null>(null)

  return (
    <div className="space-y-1 text-sm leading-relaxed text-slate-700">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'spacer':
            return <div key={i} className="h-2" />
          case 'paragraph':
            return (
              <p key={i} className="break-words">
                <Inlines inlines={block.inlines} />
              </p>
            )
          case 'list':
            return (
              <ul key={i} className="list-disc space-y-0.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j} className="break-words">
                    <Inlines inlines={item} />
                  </li>
                ))}
              </ul>
            )
          case 'image':
            return (
              <button
                key={i}
                type="button"
                onClick={() => setZoomed(images.indexOf(block.src))}
                className="block overflow-hidden rounded-lg ring-1 ring-slate-200"
                title={t('photos.enlarge')}
              >
                <img src={block.src} alt="" loading="lazy" className="max-h-80 max-w-full object-contain" />
              </button>
            )
        }
      })}
      {zoomed !== null && (
        <Lightbox images={images} start={zoomed} onClose={() => setZoomed(null)} />
      )}
    </div>
  )
}

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((inline, i) => {
        switch (inline.type) {
          case 'text':
            return <span key={i}>{inline.text}</span>
          case 'bold':
            return (
              <strong key={i} className="font-semibold text-slate-900">
                <Inlines inlines={inline.children} />
              </strong>
            )
          case 'link':
            return (
              <a
                key={i}
                href={inline.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:decoration-indigo-600"
              >
                {inline.label}
              </a>
            )
        }
      })}
    </>
  )
}
