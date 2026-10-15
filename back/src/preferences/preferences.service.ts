import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Preferences } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertPreferencesDto } from './dto/upsert-preferences.dto';
import {
  ERASMUS_PREFS,
  SEMESTER_PREFS,
  type ErasmusPref,
  type PreferencesResponse,
  type SemesterPref,
} from './preferences.types';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<PreferencesResponse> {
    const prefs = await this.prisma.preferences.findUnique({
      where: { userId },
    });
    if (prefs === null) {
      throw new NotFoundException(
        'Aucune préférence enregistrée pour cet utilisateur',
      );
    }
    return this.toResponse(prefs);
  }

  /**
   * Crée les préférences ou remplace celles qui existent (relation 1-1 :
   * userId est unique). Un champ optionnel absent du corps est remis à null,
   * conformément à la sémantique de PUT.
   *
   * La table est plate côté base ; les deux catégories du DTO y sont aplaties
   * ici, et regroupées à nouveau dans toResponse.
   */
  async upsert(
    userId: string,
    dto: UpsertPreferencesDto,
  ): Promise<PreferencesResponse> {
    const data = {
      // critères de score
      budgetMax: dto.scoring.budgetMax ?? null,
      countries: JSON.stringify(dto.scoring.countries),
      languages: JSON.stringify(dto.scoring.languages),
      studyFields: JSON.stringify(dto.scoring.studyFields ?? []),
      userGpa: dto.scoring.userGpa ?? null,
      semesterPref: dto.scoring.semesterPref ?? null,
      wantsDoubleDiploma: dto.scoring.wantsDoubleDiploma ?? false,
      erasmusPref: dto.scoring.erasmusPref ?? null,
      minSpots: dto.scoring.minSpots ?? null,
      strictMode: dto.scoring.strictMode ?? false,
      // notes personnelles
      foodPref: dto.notes?.foodPref ?? null,
      socialPref: dto.notes?.socialPref ?? null,
      climatePref: dto.notes?.climatePref ?? null,
      housingType: dto.notes?.housingType ?? null,
    };

    const prefs = await this.prisma.preferences.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return this.toResponse(prefs);
  }

  private toResponse(prefs: Preferences): PreferencesResponse {
    return {
      id: prefs.id,
      userId: prefs.userId,
      scoring: {
        budgetMax: prefs.budgetMax,
        countries: this.parseStringArray(prefs.countries, 'countries'),
        languages: this.parseStringArray(prefs.languages, 'languages'),
        studyFields: this.parseStringArray(prefs.studyFields, 'studyFields'),
        userGpa: prefs.userGpa,
        semesterPref: this.parseSemesterPref(prefs.semesterPref),
        wantsDoubleDiploma: prefs.wantsDoubleDiploma,
        erasmusPref: this.parseErasmusPref(prefs.erasmusPref),
        minSpots: prefs.minSpots,
        strictMode: prefs.strictMode,
      },
      notes: {
        foodPref: prefs.foodPref,
        socialPref: prefs.socialPref,
        climatePref: prefs.climatePref,
        housingType: prefs.housingType,
      },
    };
  }

  /**
   * SQLite n'ayant pas de type tableau, ces colonnes sont du JSON string.
   * Une ligne écrite hors de ce service pourrait être malformée : on échoue
   * avec un message explicite plutôt qu'avec un JSON.parse nu.
   */
  private parseStringArray(raw: string, field: string): string[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new InternalServerErrorException(
        `Le champ ${field} n'est pas du JSON valide en base`,
      );
    }

    if (
      !Array.isArray(parsed) ||
      !parsed.every((item): item is string => typeof item === 'string')
    ) {
      throw new InternalServerErrorException(
        `Le champ ${field} n'est pas un tableau de chaînes en base`,
      );
    }

    return parsed;
  }

  /** Colonne String libre en base : on revérifie la valeur à la lecture. */
  private parseSemesterPref(raw: string | null): SemesterPref | null {
    if (raw === null) {
      return null;
    }
    if (!(SEMESTER_PREFS as readonly string[]).includes(raw)) {
      throw new InternalServerErrorException(
        `Le champ semesterPref a une valeur inconnue en base : ${raw}`,
      );
    }
    return raw as SemesterPref;
  }

  /** Colonne String libre en base : on revérifie la valeur à la lecture. */
  private parseErasmusPref(raw: string | null): ErasmusPref | null {
    if (raw === null) {
      return null;
    }
    if (!(ERASMUS_PREFS as readonly string[]).includes(raw)) {
      throw new InternalServerErrorException(
        `Le champ erasmusPref a une valeur inconnue en base : ${raw}`,
      );
    }
    return raw as ErasmusPref;
  }
}
