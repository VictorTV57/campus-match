// Drapeaux en SVG (flag-icons) plutôt qu'en emoji : Windows n'affiche pas
// les emoji drapeaux (on verrait "JP" au lieu du drapeau japonais).
import 'flag-icons/css/flag-icons.min.css'
import { useI18n } from '../i18n/useI18n'
import { countryCode, languageInfo } from './countryCodes'
import { countryName, languageName } from './displayNames'

function Flag({ code, label }: { code: string; label: string }) {
  return (
    <span
      className={`fi fi-${code} shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]`}
      role="img"
      aria-label={label}
    />
  )
}

/** Drapeau + nom du pays, traduit dans la langue de l'interface. */
export function CountryLabel({ country }: { country: string }) {
  const { lang } = useI18n()
  const code = countryCode(country)
  const name = countryName(lang, country)
  return (
    <span className="inline-flex items-center gap-1.5">
      {code !== null && <Flag code={code} label={name} />}
      {name}
    </span>
  )
}

/** Drapeau + nom de la langue d'enseignement, traduit. */
export function LanguageLabel({ language }: { language: string }) {
  const { lang } = useI18n()
  const info = languageInfo(language)
  const name = languageName(lang, language)
  return (
    <span className="inline-flex items-center gap-1.5">
      {info !== null && <Flag code={info.flag} label={name} />}
      {name}
    </span>
  )
}
