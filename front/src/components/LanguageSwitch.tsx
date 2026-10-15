import { useI18n } from '../i18n/useI18n'
import { LANGS } from '../i18n/messages'

/** Bascule FR / EN de l'interface (mémorisée dans le navigateur). */
export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div role="group" aria-label={t('lang.label')} className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition ${
            lang === code ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
