/**
 * Durée de séjour souhaitée. Correspondance avec University.semester :
 * - "full-year" : "Full-year only" ou "Full-year or semester"
 * - "semester"  : "Semester only" ou "Full-year or semester"
 * - "any"       : toutes
 */
export const SEMESTER_PREFS = ['full-year', 'semester', 'any'] as const;
export type SemesterPref = (typeof SEMESTER_PREFS)[number];

/** Erasmus+ : "yes" = le veut, "no" = n'en veut pas, "any" = peu importe. */
export const ERASMUS_PREFS = ['yes', 'no', 'any'] as const;
export type ErasmusPref = (typeof ERASMUS_PREFS)[number];

/**
 * Critères de score. Ce type est la source de vérité de ce qui entre dans le
 * calcul de compatibilité : le module de scoring ne consomme que ça.
 */
export interface ScoringPreferences {
  /** Euros, comparé à University.extraChargeEur. null = pas de limite. */
  budgetMax: number | null;
  countries: string[];
  languages: string[];
  /** Comparé à University.specializations ; [] = pas de préférence. */
  studyFields: string[];
  /** GPA sur 4, comparé à University.gpaMin. */
  userGpa: number | null;
  semesterPref: SemesterPref | null;
  /** Comparé à University.doubleDiploma ; false = critère ignoré. */
  wantsDoubleDiploma: boolean;
  /** Comparé à University.erasmus ; null ou "any" = critère ignoré. */
  erasmusPref: ErasmusPref | null;
  /** Places minimum (partir à plusieurs), comparé à University.spots. */
  minSpots: number | null;
  /** Ne classer que les universités qui respectent tout (voir passesStrict). */
  strictMode: boolean;
}

/**
 * Notes personnelles : restituées telles quelles, hors du calcul de score.
 * Aucune contrepartie dans les données université.
 */
export interface PersonalNotes {
  foodPref: string | null;
  socialPref: string | null;
  climatePref: string | null;
  housingType: string | null;
}

/**
 * Préférences exposées par l'API. countries et languages sont des tableaux
 * ici, alors qu'ils sont stockés en JSON string en base.
 */
export interface PreferencesResponse {
  id: string;
  userId: string;
  scoring: ScoringPreferences;
  notes: PersonalNotes;
}
