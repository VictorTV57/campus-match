import { Link } from 'react-router'
import { Card } from '../components/ui'
import type { MessageKey } from '../i18n/messages'
import { useI18n } from '../i18n/useI18n'

/** Sections de l'aide, dans l'ordre d'utilisation de l'app. */
const SECTIONS: { title: MessageKey; body: MessageKey; to?: string }[] = [
  { title: 'help.start.title', body: 'help.start.body', to: '/preferences' },
  { title: 'help.score.title', body: 'help.score.body' },
  { title: 'help.swipe.title', body: 'help.swipe.body', to: '/swipe' },
  { title: 'help.top8.title', body: 'help.top8.body', to: '/top8' },
  { title: 'help.sheet.title', body: 'help.sheet.body' },
  { title: 'help.export.title', body: 'help.export.body', to: '/' },
  { title: 'help.data.title', body: 'help.data.body' },
]

export function HelpPage() {
  const { t } = useI18n()
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('help.title')}</h1>
        <p className="text-sm text-slate-500">{t('help.intro')}</p>
      </div>
      {SECTIONS.map(({ title, body, to }) => (
        <Card key={title} className="space-y-2">
          <h2 className="font-semibold">
            {to === undefined ? (
              t(title)
            ) : (
              <Link to={to} className="hover:text-indigo-600 hover:underline">
                {t(title)} →
              </Link>
            )}
          </h2>
          <HelpText text={t(body)} />
        </Card>
      ))}
    </div>
  )
}

/** Une ligne = un paragraphe ; les lignes « - » consécutives forment une liste. */
function HelpText({ text }: { text: string }) {
  const blocks: (string | string[])[] = []
  for (const line of text.split('\n')) {
    const previous = blocks[blocks.length - 1]
    if (line.startsWith('- ')) {
      if (Array.isArray(previous)) previous.push(line.slice(2))
      else blocks.push([line.slice(2)])
    } else {
      blocks.push(line)
    }
  }
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {blocks.map((block, i) =>
        Array.isArray(block) ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {block.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{block}</p>
        ),
      )}
    </div>
  )
}
