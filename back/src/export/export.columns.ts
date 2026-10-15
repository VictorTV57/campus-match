import type { SwipeAction } from '../swipes/swipes.types';
import type { UniversitySummary } from '../universities/university.mapper';

export const EXPORT_LANGS = ['fr', 'en'] as const;
export type ExportLang = (typeof EXPORT_LANGS)[number];

/**
 * - `catalog` : toutes les universités, sans aucune donnée personnelle ;
 * - `swipes` : seulement mes universités swipées, classées, avec mon score.
 */
export const EXPORT_KINDS = ['catalog', 'swipes'] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

/** Une ligne d'export : la fiche (copie locale de mya) + mes données perso. */
export interface ExportRow {
  university: UniversitySummary & { sourceUpdatedAt: Date };
  /** Place dans le classement de mes swipes (1..n), null pour un pass. */
  rank: number | null;
  /** Score de compatibilité 0..1, null sans préférences. */
  score: number | null;
  swipe: SwipeAction | null;
}

/** Valeur d'une cellule : nombre, texte, lien, ou vide. */
export type CellValue =
  string | number | { text: string; hyperlink: string } | null;

export interface ExportColumn {
  header: Record<ExportLang, string>;
  /** Largeur Excel (en caractères). */
  width: number;
  /** Format numérique Excel (ex. pourcentage). */
  numFmt?: string;
  value: (row: ExportRow, lang: ExportLang) => CellValue;
}

const YES_NO: Record<ExportLang, [string, string]> = {
  fr: ['Oui', 'Non'],
  en: ['Yes', 'No'],
};
const yesNo = (value: boolean, lang: ExportLang) => YES_NO[lang][value ? 0 : 1];

/** Valeurs University.semester (API mya) → libellé. */
const SEMESTERS: Record<string, Record<ExportLang, string>> = {
  'Full-year only': { fr: 'Année complète', en: 'Full year only' },
  'Full-year or semester': {
    fr: 'Année ou semestre',
    en: 'Full year or semester',
  },
  'Semester only': { fr: 'Semestre seul', en: 'Semester only' },
};

const SWIPES: Record<SwipeAction, Record<ExportLang, string>> = {
  like: { fr: 'Like', en: 'Like' },
  superlike: { fr: 'Super like', en: 'Super like' },
  pass: { fr: 'Passée', en: 'Passed' },
};

export const MYA_UNIVERSITY_URL = 'https://mya.epitech.eu/university/';

/** Colonnes personnelles : seulement dans l'export de mes swipes. */
const PERSONAL_COLUMNS: ExportColumn[] = [
  {
    header: { fr: 'Classement', en: 'Rank' },
    width: 12,
    value: (r) => r.rank,
  },
  {
    header: { fr: 'Mon swipe', en: 'My swipe' },
    width: 12,
    value: (r, lang) => (r.swipe === null ? null : SWIPES[r.swipe][lang]),
  },
  {
    header: { fr: 'Mon score', en: 'My score' },
    width: 11,
    numFmt: '0%',
    value: (r) => (r.score === null ? null : Math.round(r.score * 100) / 100),
  },
];

/**
 * Colonnes du catalogue, dans l'ordre. Toutes les infos qui servent de
 * critère ou de filtre dans l'app y sont. Pas de colonne ville : l'API
 * mya ne fournit que le pays.
 */
const CATALOG_COLUMNS: ExportColumn[] = [
  {
    header: { fr: 'Université', en: 'University' },
    width: 45,
    value: (r) => r.university.name,
  },
  {
    header: { fr: 'ID mya', en: 'mya ID' },
    width: 9,
    value: (r) => r.university.myaId,
  },
  {
    header: { fr: 'Pays', en: 'Country' },
    width: 18,
    value: (r) => r.university.country,
  },
  {
    header: { fr: "Langue d'enseignement", en: 'Teaching language' },
    width: 20,
    value: (r) => r.university.language,
  },
  {
    header: { fr: 'Spécialisations', en: 'Specializations' },
    width: 50,
    value: (r) => r.university.specializations.join(', '),
  },
  {
    header: { fr: 'Frais supplémentaires (€)', en: 'Extra fees (€)' },
    width: 14,
    numFmt: '#,##0',
    value: (r) => r.university.extraChargeEur,
  },
  {
    header: { fr: 'GPA minimum', en: 'Minimum GPA' },
    width: 13,
    value: (r) => r.university.gpaMin,
  },
  {
    header: { fr: 'Durée du séjour', en: 'Length of stay' },
    width: 22,
    value: (r, lang) =>
      SEMESTERS[r.university.semester]?.[lang] ?? r.university.semester,
  },
  {
    header: { fr: 'Double diplôme', en: 'Double degree' },
    width: 14,
    value: (r, lang) => yesNo(r.university.doubleDiploma, lang),
  },
  {
    header: { fr: 'Erasmus+', en: 'Erasmus+' },
    width: 10,
    value: (r, lang) => yesNo(r.university.erasmus, lang),
  },
  {
    header: { fr: 'Places', en: 'Spots' },
    width: 8,
    value: (r) => r.university.spots,
  },
  {
    header: { fr: 'Fiche mya', en: 'mya page' },
    width: 42,
    value: (r) => {
      const url = `${MYA_UNIVERSITY_URL}${r.university.myaId}`;
      return { text: url, hyperlink: url };
    },
  },
  {
    header: { fr: 'Mise à jour Epitech', en: 'Epitech update' },
    width: 18,
    value: (r) => r.university.sourceUpdatedAt.toISOString().slice(0, 10),
  },
];

export function columnsFor(kind: ExportKind): ExportColumn[] {
  return kind === 'catalog'
    ? CATALOG_COLUMNS
    : [...PERSONAL_COLUMNS, ...CATALOG_COLUMNS];
}
