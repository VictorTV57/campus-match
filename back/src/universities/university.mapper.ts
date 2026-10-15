import { InternalServerErrorException } from '@nestjs/common';
import type { University } from '@prisma/client';

/** Infos affichées sur une carte (classement, swipe). */
export interface UniversitySummary {
  id: string;
  myaId: number;
  name: string;
  country: string;
  language: string;
  extraChargeEur: number;
  gpaMin: number | null;
  semester: string;
  spots: number;
  doubleDiploma: boolean;
  erasmus: boolean;
  specializations: string[];
  images: string[];
}

/** Fiche complète, avec les sections texte. */
export interface UniversityDetail extends UniversitySummary {
  overview: string;
  administrative: string;
  accommodation: string;
  courses: string;
  cost: string;
  active: boolean;
  sourceUpdatedAt: Date;
}

export function toSummary(uni: University): UniversitySummary {
  return {
    id: uni.id,
    myaId: uni.myaId,
    name: uni.name,
    country: uni.country,
    language: uni.language,
    extraChargeEur: uni.extraChargeEur,
    gpaMin: uni.gpaMin,
    semester: uni.semester,
    spots: uni.spots,
    doubleDiploma: uni.doubleDiploma,
    erasmus: uni.erasmus,
    specializations: parseStringArray(uni.specializations, uni),
    images: parseStringArray(uni.images, uni),
  };
}

export function toDetail(uni: University): UniversityDetail {
  return {
    ...toSummary(uni),
    overview: uni.overview,
    administrative: uni.administrative,
    accommodation: uni.accommodation,
    courses: uni.courses,
    cost: uni.cost,
    active: uni.active,
    sourceUpdatedAt: uni.sourceUpdatedAt,
  };
}

/** Colonnes JSON string écrites par le sync ; revérifiées à la lecture. */
function parseStringArray(raw: string, uni: University): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item): item is string => typeof item === 'string')
  ) {
    throw new InternalServerErrorException(
      `Université ${uni.myaId} : tableau JSON invalide en base`,
    );
  }
  return parsed;
}
