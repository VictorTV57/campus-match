/**
 * Forme brute des réponses de https://mya.epitech.eu (API non documentée,
 * relevée le 2026-10-14 sur 137 fiches). Toute divergence est rejetée par
 * mya.validation.ts avant d'atteindre la base.
 */

export const MYA_BASE_URL = 'https://mya.epitech.eu';

export const MYA_SEMESTERS = [
  'Full-year only',
  'Full-year or semester',
  'Semester only',
] as const;
export type MyaSemester = (typeof MYA_SEMESTERS)[number];

export type MyaYesNo = 'YES' | 'NO';

/** Élément de GET /api/universities. */
export interface MyaListItem {
  id: number;
  name: string;
  country: string;
  gpa: number;
  spots: number;
  extracharge: number;
  erasmus: MyaYesNo;
  semester: MyaSemester;
}

/** Réponse de GET /api/universities/:id. */
export interface MyaUniversity {
  id: number;
  name: string;
  country: string;
  gpa: number; // 0 = pas d'exigence
  spots: number;
  diploma: MyaYesNo; // double diplôme
  language: string;
  extracharge: number; // euros
  overview: string; // HTML
  administrative: string; // HTML
  accomodation: string; // HTML — orthographe de l'API
  courses: string; // HTML
  cost: string; // HTML
  image1: string; // nom de fichier sous /uploads/
  image2: string | null;
  image3: string | null;
  erasmus: MyaYesNo;
  semester: MyaSemester;
  display: MyaYesNo;
  updatedAt: string; // ISO 8601
  specializations: string[];
}
