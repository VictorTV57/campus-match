import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  toDetail,
  toSummary,
  type UniversityDetail,
} from './university.mapper';

/** Valeurs proposées dans le questionnaire de préférences. */
export interface UniversityFilters {
  countries: string[];
  languages: string[];
  specializations: string[];
}

@Injectable()
export class UniversitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string): Promise<UniversityDetail> {
    const uni = await this.prisma.university.findUnique({ where: { id } });
    if (uni === null) {
      throw new NotFoundException('Université introuvable');
    }
    return toDetail(uni);
  }

  /** Valeurs distinctes présentes parmi les universités actives, triées. */
  async filters(): Promise<UniversityFilters> {
    const universities = await this.prisma.university.findMany({
      where: { active: true },
    });
    const summaries = universities.map(toSummary);
    const sorted = (values: string[]) =>
      [...new Set(values)].sort((a, b) => a.localeCompare(b));

    return {
      countries: sorted(summaries.map((u) => u.country)),
      languages: sorted(summaries.map((u) => u.language)),
      specializations: sorted(summaries.flatMap((u) => u.specializations)),
    };
  }
}
