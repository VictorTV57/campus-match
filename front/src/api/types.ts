// Miroir des types renvoyés par le back (back/src/**/*.types.ts, *.service.ts).
// Les dates arrivent en string ISO (sérialisation JSON).

export interface PublicUser {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  /** Compte invité (connexion anonyme) : données temporaires. */
  isGuest: boolean
}

export interface AuthResponse {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

// « Peu importe » en premier : c'est le choix par défaut, comme pour Erasmus+.
export const SEMESTER_PREFS = ['any', 'full-year', 'semester'] as const
export type SemesterPref = (typeof SEMESTER_PREFS)[number]

export const ERASMUS_PREFS = ['any', 'yes', 'no'] as const
export type ErasmusPref = (typeof ERASMUS_PREFS)[number]

export interface ScoringPreferences {
  budgetMax: number | null
  countries: string[]
  languages: string[]
  studyFields: string[]
  userGpa: number | null
  semesterPref: SemesterPref | null
  wantsDoubleDiploma: boolean
  erasmusPref: ErasmusPref | null
  minSpots: number | null
  strictMode: boolean
}

export interface PersonalNotes {
  foodPref: string | null
  socialPref: string | null
  climatePref: string | null
  housingType: string | null
}

export interface Preferences {
  id: string
  userId: string
  scoring: ScoringPreferences
  notes: PersonalNotes
}

/** Corps de PUT /preferences : champs optionnels omis plutôt que null. */
export interface PreferencesInput {
  scoring: {
    budgetMax?: number
    countries: string[]
    languages: string[]
    studyFields?: string[]
    userGpa?: number
    semesterPref?: SemesterPref
    wantsDoubleDiploma?: boolean
    erasmusPref?: ErasmusPref
    minSpots?: number
    strictMode?: boolean
  }
  notes?: Partial<Record<keyof PersonalNotes, string>>
}

export interface UniversityFilters {
  countries: string[]
  languages: string[]
  specializations: string[]
}

export interface UniversitySummary {
  id: string
  myaId: number
  name: string
  country: string
  language: string
  extraChargeEur: number
  gpaMin: number | null
  semester: string
  spots: number
  doubleDiploma: boolean
  erasmus: boolean
  specializations: string[]
  images: string[]
}

export interface UniversityDetail extends UniversitySummary {
  overview: string
  administrative: string
  accommodation: string
  courses: string
  cost: string
  active: boolean
  sourceUpdatedAt: string
}

export const CRITERIA = [
  'country',
  'language',
  'specialization',
  'budget',
  'gpa',
  'semester',
  'doubleDiploma',
  'erasmus',
  'spots',
] as const
export type Criterion = (typeof CRITERIA)[number]

export type CriterionResult =
  | { included: true; score: number; weight: number }
  | { included: false; reason: 'no-preference' | 'no-data' }

export interface ScoreResult {
  score: number | null
  breakdown: Record<Criterion, CriterionResult>
  /** Respecte entièrement chaque critère renseigné (mode strict). */
  strictMatch: boolean
}

export type SwipeAction = 'like' | 'pass' | 'superlike'

export interface RankedUniversity extends ScoreResult {
  rank: number
  rankScore: number
  swipe: SwipeAction | null
  university: UniversitySummary
}

export interface DeckCard extends ScoreResult {
  university: UniversityDetail
}

export interface Deck {
  cards: DeckCard[]
  remaining: number
}
