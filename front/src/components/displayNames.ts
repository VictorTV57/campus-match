import type { Lang } from '../i18n/messages'
import { countryCode, languageInfo } from './countryCodes'

type Kind = 'region' | 'language'

const cache = new Map<string, Intl.DisplayNames>()

function displayNames(lang: Lang, kind: Kind): Intl.DisplayNames {
  const key = `${lang}:${kind}`
  let names = cache.get(key)
  if (names === undefined) {
    names = new Intl.DisplayNames([lang], { type: kind })
    cache.set(key, names)
  }
  return names
}

/**
 * Nom d'un pays ou d'une langue dans la langue de l'interface
 * ("JP" → "Japon" / "Japan"), via Intl.DisplayNames. Repli : le nom brut.
 * En français, la langue est mise en majuscule ("anglais" → "Anglais").
 */
// Noms officiels trop longs pour une pastille ("R.A.S. chinoise de Hong Kong").
const SHORT_NAMES: Record<string, string> = { 'region:HK': 'Hong Kong' }

export function displayName(lang: Lang, kind: Kind, code: string | null, fallback: string): string {
  if (code === null) return fallback
  const short = SHORT_NAMES[`${kind}:${code}`]
  if (short !== undefined) return short
  try {
    const name = displayNames(lang, kind).of(code)
    if (name === undefined || name === code) return fallback
    return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1)
  } catch {
    return fallback
  }
}

export function countryName(lang: Lang, country: string): string {
  return displayName(lang, 'region', countryCode(country)?.toUpperCase() ?? null, country)
}

export function languageName(lang: Lang, language: string): string {
  return displayName(lang, 'language', languageInfo(language)?.code ?? null, language)
}
