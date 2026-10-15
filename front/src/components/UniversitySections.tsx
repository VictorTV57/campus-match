import type { UniversityDetail } from '../api/types'
import { useI18n } from '../i18n/useI18n'
import type { MessageKey } from '../i18n/messages'
import { RichText } from './RichText'

type SectionKey = 'overview' | 'courses' | 'administrative' | 'accommodation' | 'cost'

const SECTIONS: { key: SectionKey; title: MessageKey }[] = [
  { key: 'overview', title: 'section.overview' },
  { key: 'courses', title: 'section.courses' },
  { key: 'accommodation', title: 'section.accommodation' },
  { key: 'cost', title: 'section.cost' },
  { key: 'administrative', title: 'section.administrative' },
]

/**
 * Sections texte d'une fiche. En mode `collapsible`, chaque section est
 * repliable (présentation ouverte par défaut) — pratique dans une carte.
 */
export function UniversitySections({
  university,
  collapsible = false,
  skip = [],
}: {
  university: UniversityDetail
  collapsible?: boolean
  skip?: SectionKey[]
}) {
  const { t } = useI18n()
  const sections = SECTIONS.filter(
    ({ key }) => !skip.includes(key) && university[key].trim() !== '',
  )

  if (!collapsible) {
    return (
      <div className="space-y-4">
        {sections.map(({ key, title }) => (
          <section key={key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-2 font-semibold">{t(title)}</h2>
            <RichText source={university[key]} />
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
      {sections.map(({ key, title }) => (
        <details key={key} open={key === 'overview'} className="group px-4 py-2">
          <summary className="cursor-pointer list-none py-1 text-sm font-semibold text-slate-800 select-none">
            <span className="mr-1 inline-block transition group-open:rotate-90">›</span>
            {t(title)}
          </summary>
          <div className="pt-1 pb-2">
            <RichText source={university[key]} />
          </div>
        </details>
      ))}
    </div>
  )
}
