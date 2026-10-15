import type { SemesterPref } from '../preferences/preferences.types';
import type { ScorableUniversity } from './scoring';
import { semesterCompatible } from './scoring';

/**
 * Filtres du top 8 : contrairement au score (qui note), ils retirent les
 * universités qui ne passent pas, avant la coupe à 8. Un filtre absent (ou
 * liste vide) ne filtre rien.
 */
export interface RankingFilters {
  countries?: string[];
  languages?: string[];
  /** L'université doit proposer au moins une de ces spécialisations. */
  specializations?: string[];
  /** Frais supplémentaires maximum, en euros. */
  maxCharge?: number;
  /** GPA de l'élève : exclut les universités qui exigent plus. */
  gpa?: number;
  semester?: Exclude<SemesterPref, 'any'>;
  /** true = seulement les universités qui délivrent un double diplôme. */
  doubleDiploma?: boolean;
  /** true = seulement Erasmus+, false = seulement hors Erasmus+. */
  erasmus?: boolean;
  /** Nombre minimum de places (pour partir à plusieurs). */
  minSpots?: number;
}

/** Champs université utilisés par les filtres (les mêmes que le score). */
export type FilterableUniversity = ScorableUniversity;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function oneOf(wanted: string[] | undefined, actual: string): boolean {
  if (wanted === undefined || wanted.length === 0) return true;
  const target = normalize(actual);
  return wanted.some((w) => normalize(w) === target);
}

export function matchesFilters(
  uni: FilterableUniversity,
  filters: RankingFilters,
): boolean {
  const { specializations: wantedSpecs = [] } = filters;
  if (!oneOf(filters.countries, uni.country)) return false;
  if (!oneOf(filters.languages, uni.language)) return false;
  if (
    wantedSpecs.length > 0 &&
    !uni.specializations.some((s) => oneOf(wantedSpecs, s))
  ) {
    return false;
  }
  if (
    filters.maxCharge !== undefined &&
    uni.extraChargeEur > filters.maxCharge
  ) {
    return false;
  }
  // gpaMin null = pas d'exigence : toujours accessible.
  if (
    filters.gpa !== undefined &&
    uni.gpaMin !== null &&
    uni.gpaMin > filters.gpa
  ) {
    return false;
  }
  if (
    filters.semester !== undefined &&
    !semesterCompatible(filters.semester, uni.semester)
  ) {
    return false;
  }
  if (filters.doubleDiploma === true && !uni.doubleDiploma) return false;
  if (filters.erasmus !== undefined && uni.erasmus !== filters.erasmus) {
    return false;
  }
  if (filters.minSpots !== undefined && uni.spots < filters.minSpots) {
    return false;
  }
  return true;
}
