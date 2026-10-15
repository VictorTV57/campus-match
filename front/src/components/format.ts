import type { Criterion, SwipeAction } from '../api/types'
import type { I18nValue } from '../i18n/i18n'
import type { Lang, MessageKey } from '../i18n/messages'

type T = I18nValue['t']

const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' }

/** Page publique de l'université sur le site Epitech (route du front mya). */
export function myaUniversityUrl(myaId: number): string {
  return `https://mya.epitech.eu/university/${myaId}`
}

export function locale(lang: Lang): string {
  return LOCALES[lang]
}

export function formatExtraCharge(t: T, lang: Lang, eur: number): string {
  if (eur === 0) return t('uni.extraCharge.none')
  const amount = new Intl.NumberFormat(locale(lang), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(eur)
  return t('uni.extraCharge', { amount })
}

export const CRITERION_KEYS: Record<Criterion, MessageKey> = {
  country: 'criterion.country',
  language: 'criterion.language',
  specialization: 'criterion.specialization',
  budget: 'criterion.budget',
  gpa: 'criterion.gpa',
  semester: 'criterion.semester',
  doubleDiploma: 'criterion.doubleDiploma',
  erasmus: 'criterion.erasmus',
  spots: 'criterion.spots',
}

/** Valeurs University.semester telles que fournies par l'API mya. */
const SEMESTER_KEYS: Record<string, MessageKey> = {
  'Full-year only': 'semester.fullYearOnly',
  'Full-year or semester': 'semester.fullYearOrSemester',
  'Semester only': 'semester.semesterOnly',
}

export function semesterLabel(t: T, semester: string): string {
  const key = SEMESTER_KEYS[semester]
  return key === undefined ? semester : t(key)
}

export const SWIPE_KEYS: Record<SwipeAction, MessageKey> = {
  like: 'swipe.like',
  superlike: 'swipe.superlike',
  pass: 'swipe.pass',
}
