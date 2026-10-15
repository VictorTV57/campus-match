import { createContext } from 'react'
import { LANGS, translate, type Lang, type MessageKey, type Vars } from './messages'

const STORAGE_KEY = 'campusmatch.lang'

export interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: MessageKey, vars?: Vars) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

/** Langue mémorisée, sinon celle du navigateur (français par défaut). */
export function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null && (LANGS as readonly string[]).includes(stored)) return stored as Lang
  } catch {
    // stockage indisponible : on se rabat sur le navigateur
  }
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr'
}

export function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // préférence non mémorisée, sans gravité
  }
}

// Copie hors React de la langue courante, pour le code non-composant
// (messages d'erreur du client HTTP).
let currentLang: Lang = initialLang()

export function setCurrentLang(lang: Lang): void {
  currentLang = lang
}

export function tCurrent(key: MessageKey, vars?: Vars): string {
  return translate(currentLang, key, vars)
}
