import type {
  ErasmusPref,
  ScoringPreferences,
  SemesterPref,
} from '../preferences/preferences.types';

/**
 * Score de compatibilité préférences ↔ université : moyenne pondérée de
 * critères notés entre 0 et 1.
 *
 * Règle centrale : un critère sans préférence (côté élève) ou sans donnée
 * (côté université) est EXCLU de la moyenne — jamais compté comme 0 — pour
 * ne pas pénaliser une université sur une simple absence d'information.
 *
 * Module pur (ni Nest ni Prisma) : c'est la logique la plus sensible aux
 * régressions, testée dans scoring.spec.ts.
 */

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
] as const;
export type Criterion = (typeof CRITERIA)[number];

/**
 * Poids relatifs (seul leur rapport compte) :
 * - pays à 5 : un pays non choisi doit nettement décrocher, sinon une
 *   université hors de mes pays gardait ~80 % dès que le reste collait ;
 * - langue à 3 : quasi éliminatoire ;
 * - double diplôme à 3 : quand on le veut, c'est un objectif fort ;
 * - Erasmus+ et places minimum à 2 (au niveau du budget) ;
 * - gpa et semestre : contraintes binaires secondaires.
 */
export const CRITERION_WEIGHTS: Readonly<Record<Criterion, number>> = {
  country: 5,
  language: 3,
  specialization: 2,
  budget: 2,
  gpa: 1,
  semester: 1,
  doubleDiploma: 3,
  erasmus: 2,
  spots: 2,
};

/** Champs University utiles au score, specializations déjà désérialisé. */
export interface ScorableUniversity {
  country: string;
  language: string;
  specializations: string[];
  extraChargeEur: number;
  gpaMin: number | null;
  semester: string;
  doubleDiploma: boolean;
  erasmus: boolean;
  spots: number;
}

export type ExclusionReason = 'no-preference' | 'no-data';

export type CriterionResult =
  | { included: true; score: number; weight: number }
  | { included: false; reason: ExclusionReason };

export interface ScoreResult {
  /** Entre 0 et 1 ; null si aucun critère n'a pu être évalué. */
  score: number | null;
  breakdown: Record<Criterion, CriterionResult>;
  /** Respecte entièrement chaque critère renseigné (voir passesStrict). */
  strictMatch: boolean;
}

type CriterionScore = number | ExclusionReason;

export function scoreUniversity(
  prefs: ScoringPreferences,
  uni: ScorableUniversity,
): ScoreResult {
  const raw: Record<Criterion, CriterionScore> = {
    country: scoreMembership(prefs.countries, uni.country),
    language: scoreMembership(prefs.languages, uni.language),
    specialization: scoreSpecialization(prefs.studyFields, uni.specializations),
    budget: scoreBudget(prefs.budgetMax, uni.extraChargeEur),
    gpa: scoreGpa(prefs.userGpa, uni.gpaMin),
    semester: scoreSemester(prefs.semesterPref, uni.semester),
    doubleDiploma: prefs.wantsDoubleDiploma
      ? Number(uni.doubleDiploma)
      : 'no-preference',
    erasmus: scoreErasmus(prefs.erasmusPref, uni.erasmus),
    spots:
      prefs.minSpots === null
        ? 'no-preference'
        : Number(uni.spots >= prefs.minSpots),
  };

  let weightedSum = 0;
  let totalWeight = 0;
  const breakdown = {} as Record<Criterion, CriterionResult>;

  for (const criterion of CRITERIA) {
    const value = raw[criterion];
    if (typeof value === 'number') {
      const weight = CRITERION_WEIGHTS[criterion];
      weightedSum += value * weight;
      totalWeight += weight;
      breakdown[criterion] = { included: true, score: value, weight };
    } else {
      breakdown[criterion] = { included: false, reason: value };
    }
  }

  return {
    score: totalWeight === 0 ? null : weightedSum / totalWeight,
    breakdown,
    strictMatch: passesStrict(breakdown),
  };
}

/**
 * Mode strict : l'université respecte-t-elle entièrement chaque critère
 * renseigné ? Spécialisation : au moins une de celles choisies ; autres
 * critères : score de 1 (dans le budget, pays et langue choisis, GPA
 * suffisant, durée compatible). Un critère exclu (pas de préférence ou pas
 * de donnée) ne bloque pas, comme dans le score.
 */
export function passesStrict(
  breakdown: Record<Criterion, CriterionResult>,
): boolean {
  return CRITERIA.every((criterion) => {
    const result = breakdown[criterion];
    if (!result.included) return true;
    return criterion === 'specialization'
      ? result.score > 0
      : result.score === 1;
  });
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Pays / langue : 1 si la valeur de l'université fait partie des choix. */
function scoreMembership(wanted: string[], actual: string): CriterionScore {
  if (wanted.length === 0) return 'no-preference';
  if (actual.trim() === '') return 'no-data';
  const target = normalize(actual);
  return wanted.some((w) => normalize(w) === target) ? 1 : 0;
}

/**
 * Part des spécialisations choisies que l'université propose : 2 sur 3
 * choisies → 0.67. Récompense les universités qui couvrent le plus de ce
 * que je cherche, sans exiger qu'elles couvrent tout.
 */
function scoreSpecialization(
  studyFields: string[],
  specializations: string[],
): CriterionScore {
  const wanted = [...new Set(studyFields.map(normalize))].filter(
    (w) => w !== '',
  );
  if (wanted.length === 0) return 'no-preference';
  if (specializations.length === 0) return 'no-data';
  const offered = new Set(specializations.map(normalize));
  return wanted.filter((w) => offered.has(w)).length / wanted.length;
}

/**
 * 1 jusqu'à budgetMax inclus, puis décroissance linéaire jusqu'à 0 à
 * 2 × budgetMax. Avec budgetMax = 0 : 1 si gratuit, 0 sinon.
 */
function scoreBudget(
  budgetMax: number | null,
  extraChargeEur: number,
): CriterionScore {
  if (budgetMax === null) return 'no-preference';
  if (extraChargeEur <= budgetMax) return 1;
  if (extraChargeEur >= 2 * budgetMax) return 0;
  return 1 - (extraChargeEur - budgetMax) / budgetMax;
}

/** Binaire : le GPA de l'élève atteint-il le minimum demandé ? */
function scoreGpa(
  userGpa: number | null,
  gpaMin: number | null,
): CriterionScore {
  if (userGpa === null) return 'no-preference';
  if (gpaMin === null) return 'no-data';
  return userGpa >= gpaMin ? 1 : 0;
}

/** Formules de séjour acceptées par chaque préférence (valeurs University.semester). */
const SEMESTER_MATCHES: Record<Exclude<SemesterPref, 'any'>, string[]> = {
  'full-year': ['Full-year only', 'Full-year or semester'],
  semester: ['Semester only', 'Full-year or semester'],
};

const KNOWN_SEMESTERS = new Set(Object.values(SEMESTER_MATCHES).flat());

/** La formule de séjour de l'université convient-elle à la préférence ? */
export function semesterCompatible(
  pref: Exclude<SemesterPref, 'any'>,
  semester: string,
): boolean {
  return SEMESTER_MATCHES[pref].includes(semester);
}

function scoreSemester(
  pref: SemesterPref | null,
  semester: string,
): CriterionScore {
  if (pref === null || pref === 'any') return 'no-preference';
  if (!KNOWN_SEMESTERS.has(semester)) return 'no-data';
  return SEMESTER_MATCHES[pref].includes(semester) ? 1 : 0;
}

/** 1 si l'université correspond au choix Erasmus+ ("yes" / "no"), 0 sinon. */
function scoreErasmus(
  pref: ErasmusPref | null,
  erasmus: boolean,
): CriterionScore {
  if (pref === null || pref === 'any') return 'no-preference';
  return Number(erasmus === (pref === 'yes'));
}
