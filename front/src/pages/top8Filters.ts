// Filtres du top 8 (miroir de back/src/matching/filters.ts), stockés dans
// l'URL pour survivre au rechargement : ?countries=Japan,Canada&maxCharge=3000
import type { ScoringPreferences } from '../api/types'

export const SEMESTER_FILTERS = ['full-year', 'semester'] as const
export type SemesterFilter = (typeof SEMESTER_FILTERS)[number]

export interface Top8Filters {
  countries: string[]
  languages: string[]
  specializations: string[]
  maxCharge: number | null
  gpa: number | null
  semester: SemesterFilter | null
  /** true = seulement les universités avec double diplôme. */
  doubleDiploma: boolean
  /** true = Erasmus+ seulement, false = hors Erasmus+ seulement, null = peu importe. */
  erasmus: boolean | null
  /** Places minimum (pour partir à plusieurs). */
  minSpots: number | null
}

export const NO_FILTERS: Top8Filters = {
  countries: [],
  languages: [],
  specializations: [],
  maxCharge: null,
  gpa: null,
  semester: null,
  doubleDiploma: false,
  erasmus: null,
  minSpots: null,
}

const LIST_KEYS = ['countries', 'languages', 'specializations'] as const

function parseBoolean(raw: string | null): boolean | null {
  return raw === 'true' ? true : raw === 'false' ? false : null
}

function parseNumber(raw: string | null, max = Infinity): number | null {
  if (raw === null || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null
}

export function filtersFromParams(params: URLSearchParams): Top8Filters {
  const list = (key: string) =>
    (params.get(key) ?? '').split(',').map((v) => v.trim()).filter((v) => v !== '')
  const semester = params.get('semester')
  const maxCharge = parseNumber(params.get('maxCharge'))
  const minSpots = parseNumber(params.get('minSpots'))
  return {
    countries: list('countries'),
    languages: list('languages'),
    specializations: list('specializations'),
    maxCharge: maxCharge === null ? null : Math.round(maxCharge),
    gpa: parseNumber(params.get('gpa'), 4),
    semester: (SEMESTER_FILTERS as readonly (string | null)[]).includes(semester)
      ? (semester as SemesterFilter)
      : null,
    doubleDiploma: params.get('doubleDiploma') === 'true',
    erasmus: parseBoolean(params.get('erasmus')),
    minSpots: minSpots === null || minSpots < 1 ? null : Math.round(minSpots),
  }
}

/** Paramètres d'URL (et de requête API) : filtres vides omis. */
export function filtersToParams(filters: Top8Filters): Record<string, string> {
  const params: Record<string, string> = {}
  for (const key of LIST_KEYS) {
    if (filters[key].length > 0) params[key] = filters[key].join(',')
  }
  if (filters.maxCharge !== null) params.maxCharge = String(filters.maxCharge)
  if (filters.gpa !== null) params.gpa = String(filters.gpa)
  if (filters.semester !== null) params.semester = filters.semester
  if (filters.doubleDiploma) params.doubleDiploma = 'true'
  if (filters.erasmus !== null) params.erasmus = String(filters.erasmus)
  if (filters.minSpots !== null) params.minSpots = String(filters.minSpots)
  return params
}

export function activeFilterCount(filters: Top8Filters): number {
  return Object.keys(filtersToParams(filters)).length
}

/** Mêmes critères que le questionnaire, mais appliqués comme filtres stricts. */
export function filtersFromPreferences(scoring: ScoringPreferences): Top8Filters {
  return {
    countries: scoring.countries,
    languages: scoring.languages,
    specializations: scoring.studyFields,
    maxCharge: scoring.budgetMax,
    gpa: scoring.userGpa,
    semester:
      scoring.semesterPref === null || scoring.semesterPref === 'any'
        ? null
        : scoring.semesterPref,
    doubleDiploma: scoring.wantsDoubleDiploma,
    erasmus: scoring.erasmusPref === 'yes' ? true : scoring.erasmusPref === 'no' ? false : null,
    minSpots: scoring.minSpots,
  }
}
