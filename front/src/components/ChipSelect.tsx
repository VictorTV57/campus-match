import { useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/useI18n'
import { inputClass } from './ui'

/** Sélection multiple sous forme de pastilles, avec filtre si la liste est longue. */
export function ChipSelect({
  options,
  selected,
  onChange,
  searchPlaceholder,
  renderOption = (option) => option,
  searchText = (option) => option,
}: {
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  searchPlaceholder?: string
  /** Contenu d'une pastille (ex. drapeau + nom) ; le nom par défaut. */
  renderOption?: (option: string) => ReactNode
  /** Texte sur lequel porte la recherche (ex. nom traduit) ; la valeur par défaut. */
  searchText?: (option: string) => string
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const visible =
    q === ''
      ? options
      : options.filter(
          (o) => o.toLowerCase().includes(q) || searchText(o).toLowerCase().includes(q),
        )

  const toggle = (option: string) =>
    onChange(
      selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option],
    )

  return (
    <div className="space-y-2">
      {options.length > 12 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder ?? t('chips.filter')}
          className={inputClass}
        />
      )}
      <div className="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto">
        {visible.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {renderOption(option)}
            </button>
          )
        })}
        {visible.length === 0 && <span className="text-sm text-slate-400">{t('chips.noResult')}</span>}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{t('chips.selected', { count: selected.length })}</span>
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1">
              {renderOption(s)}
            </span>
          ))}
          <button type="button" onClick={() => onChange([])} className="text-indigo-600 hover:underline">
            {t('chips.clear')}
          </button>
        </div>
      )}
    </div>
  )
}
