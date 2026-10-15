import {
  MYA_SEMESTERS,
  type MyaListItem,
  type MyaUniversity,
} from './mya.types';

/** La réponse de l'API n'a plus la forme attendue : on n'écrit rien. */
export class MyaShapeError extends Error {
  constructor(readonly issues: string[]) {
    const shown = issues.slice(0, 20).join('\n  - ');
    const more =
      issues.length > 20 ? `\n  (+${issues.length - 20} autres)` : '';
    super(`Réponse mya inattendue :\n  - ${shown}${more}`);
    this.name = 'MyaShapeError';
  }
}

type Check = (value: unknown) => boolean;

const isString: Check = (v) => typeof v === 'string';
const isNonEmptyString: Check = (v) => typeof v === 'string' && v.trim() !== '';
const isNullableString: Check = (v) => v === null || typeof v === 'string';
const isNonNegativeInt: Check = (v) =>
  Number.isInteger(v) && (v as number) >= 0;
const isPositiveInt: Check = (v) => Number.isInteger(v) && (v as number) > 0;
const isNonNegativeNumber: Check = (v) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isYesNo: Check = (v) => v === 'YES' || v === 'NO';
const isSemester: Check = (v) =>
  (MYA_SEMESTERS as readonly unknown[]).includes(v);
const isIsoDate: Check = (v) =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v));
const isStringArray: Check = (v) =>
  Array.isArray(v) && v.every((item) => typeof item === 'string');

const LIST_ITEM_SCHEMA: Record<keyof MyaListItem, Check> = {
  id: isPositiveInt,
  name: isNonEmptyString,
  country: isNonEmptyString,
  gpa: isNonNegativeNumber,
  spots: isNonNegativeInt,
  extracharge: isNonNegativeInt,
  erasmus: isYesNo,
  semester: isSemester,
};

const UNIVERSITY_SCHEMA: Record<keyof MyaUniversity, Check> = {
  id: isPositiveInt,
  name: isNonEmptyString,
  country: isNonEmptyString,
  gpa: isNonNegativeNumber,
  spots: isNonNegativeInt,
  diploma: isYesNo,
  language: isNonEmptyString,
  extracharge: isNonNegativeInt,
  overview: isString,
  administrative: isString,
  accomodation: isString,
  courses: isString,
  cost: isString,
  image1: isNonEmptyString,
  image2: isNullableString,
  image3: isNullableString,
  erasmus: isYesNo,
  semester: isSemester,
  display: isYesNo,
  updatedAt: isIsoDate,
  specializations: isStringArray,
};

function checkObject(
  value: unknown,
  schema: Record<string, Check>,
  label: string,
): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [`${label} : objet attendu`];
  }
  const record = value as Record<string, unknown>;
  return Object.entries(schema)
    .filter(([key, check]) => !check(record[key]))
    .map(
      ([key]) =>
        `${label}.${key} invalide (reçu ${JSON.stringify(record[key]) ?? 'undefined'})`,
    );
}

/** Valide GET /api/universities ; lève MyaShapeError au moindre écart. */
export function assertMyaList(data: unknown): MyaListItem[] {
  if (!Array.isArray(data)) {
    throw new MyaShapeError(['liste : tableau attendu']);
  }
  // Une liste vide désactiverait toutes les universités : on la traite
  // comme une panne de l'API plutôt que comme une donnée valide.
  if (data.length === 0) {
    throw new MyaShapeError(['liste : vide']);
  }

  const issues = data.flatMap((item, i) =>
    checkObject(item, LIST_ITEM_SCHEMA, `liste[${i}]`),
  );
  if (issues.length === 0) {
    const seen = new Set<number>();
    for (const { id } of data as MyaListItem[]) {
      if (seen.has(id)) issues.push(`liste : id ${id} en double`);
      seen.add(id);
    }
  }
  if (issues.length > 0) {
    throw new MyaShapeError(issues);
  }
  return data as MyaListItem[];
}

/**
 * Valide l'ensemble des fiches détaillées d'un coup : soit tout est
 * conforme, soit MyaShapeError liste tous les écarts trouvés.
 */
export function assertMyaUniversities(
  details: { expectedId: number; data: unknown }[],
): MyaUniversity[] {
  const issues = details.flatMap(({ expectedId, data }) => {
    const label = `fiche ${expectedId}`;
    const fieldIssues = checkObject(data, UNIVERSITY_SCHEMA, label);
    if (fieldIssues.length === 0 && (data as MyaUniversity).id !== expectedId) {
      fieldIssues.push(
        `${label} : id ${(data as MyaUniversity).id} au lieu de ${expectedId}`,
      );
    }
    return fieldIssues;
  });
  if (issues.length > 0) {
    throw new MyaShapeError(issues);
  }
  return details.map(({ data }) => data as MyaUniversity);
}
