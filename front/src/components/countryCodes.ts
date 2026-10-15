// Nom de pays tel qu'écrit par l'API mya → code ISO 3166-1 alpha-2 (minuscule,
// format attendu par flag-icons). Couvre les 44 pays présents au 2026-10-14,
// orthographes Epitech comprises ("Chili", "Philippine", "USA"), plus
// quelques variantes. Un pays absent s'affiche simplement sans drapeau.
const CODES: Record<string, string> = {
  argentina: 'ar',
  australia: 'au',
  bahrain: 'bh',
  belgium: 'be',
  benin: 'bj',
  brazil: 'br',
  canada: 'ca',
  chile: 'cl',
  chili: 'cl',
  china: 'cn',
  colombia: 'co',
  croatia: 'hr',
  'czech republic': 'cz',
  czechia: 'cz',
  denmark: 'dk',
  finland: 'fi',
  france: 'fr',
  germany: 'de',
  'hong kong': 'hk',
  hungary: 'hu',
  india: 'in',
  indonesia: 'id',
  ireland: 'ie',
  italy: 'it',
  japan: 'jp',
  latvia: 'lv',
  lithuania: 'lt',
  luxembourg: 'lu',
  malaysia: 'my',
  mexico: 'mx',
  morocco: 'ma',
  netherlands: 'nl',
  'new zealand': 'nz',
  norway: 'no',
  peru: 'pe',
  philippine: 'ph',
  philippines: 'ph',
  poland: 'pl',
  portugal: 'pt',
  romania: 'ro',
  senegal: 'sn',
  singapore: 'sg',
  'south africa': 'za',
  'south korea': 'kr',
  korea: 'kr',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  taiwan: 'tw',
  thailand: 'th',
  turkey: 'tr',
  'united kingdom': 'gb',
  uk: 'gb',
  usa: 'us',
  'united states': 'us',
  vietnam: 'vn',
}

export function countryCode(country: string): string | null {
  return CODES[country.trim().toLowerCase()] ?? null
}

// Langue d'enseignement (nom anglais de l'API mya) → code de langue ISO 639-1
// (pour le nom traduit) et drapeau du pays d'origine de la langue.
const LANGUAGES: Record<string, { code: string; flag: string }> = {
  english: { code: 'en', flag: 'gb' },
  french: { code: 'fr', flag: 'fr' },
  spanish: { code: 'es', flag: 'es' },
  portuguese: { code: 'pt', flag: 'pt' },
  japanese: { code: 'ja', flag: 'jp' },
  german: { code: 'de', flag: 'de' },
  italian: { code: 'it', flag: 'it' },
  chinese: { code: 'zh', flag: 'cn' },
  korean: { code: 'ko', flag: 'kr' },
}

export function languageInfo(language: string): { code: string; flag: string } | null {
  return LANGUAGES[language.trim().toLowerCase()] ?? null
}
