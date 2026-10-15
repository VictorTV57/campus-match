import { Injectable, NotFoundException } from '@nestjs/common';
import type { University } from '@prisma/client';
import { rankScore } from '../matching/ranking';
import { scoreUniversity } from '../matching/scoring';
import { PreferencesService } from '../preferences/preferences.service';
import type { ScoringPreferences } from '../preferences/preferences.types';
import { PrismaService } from '../prisma/prisma.service';
import { SwipesService } from '../swipes/swipes.service';
import type { SwipeAction } from '../swipes/swipes.types';
import { toSummary } from '../universities/university.mapper';
import {
  columnsFor,
  type ExportKind,
  type ExportLang,
  type ExportRow,
} from './export.columns';
import { toCsv, toXlsx } from './export.format';

export type ExportFormat = 'csv' | 'xlsx';

export interface ExportFile {
  content: Buffer;
  contentType: string;
  filename: string;
}

const CONTENT_TYPES: Record<ExportFormat, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const FILE_NAMES: Record<ExportLang, Record<ExportKind, string>> = {
  fr: { catalog: 'campusmatch-universites', swipes: 'campusmatch-mes-swipes' },
  en: { catalog: 'campusmatch-universities', swipes: 'campusmatch-my-swipes' },
};

/**
 * Export tableur, lu depuis la base locale (la copie de mya faite par le
 * sync) : jamais d'appel à l'API mya ici.
 */
@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preferences: PreferencesService,
    private readonly swipes: SwipesService,
  ) {}

  async build(
    userId: string,
    options: { kind: ExportKind; format: ExportFormat; lang: ExportLang },
  ): Promise<ExportFile> {
    const rows =
      options.kind === 'catalog'
        ? await this.catalogRows()
        : await this.swipeRows(userId);
    const columns = columnsFor(options.kind);
    const content =
      options.format === 'csv'
        ? Buffer.from(toCsv(rows, columns, options.lang), 'utf8')
        : await toXlsx(rows, columns, options.lang);
    const date = new Date().toISOString().slice(0, 10);
    return {
      content,
      contentType: CONTENT_TYPES[options.format],
      filename: `${FILE_NAMES[options.lang][options.kind]}-${date}.${options.format}`,
    };
  }

  /** Toutes les universités actives, par nom, sans données personnelles. */
  private async catalogRows(): Promise<ExportRow[]> {
    const universities = await this.activeUniversities();
    return universities.map((uni) => toRow(uni, null, null, null));
  }

  /**
   * Seulement les universités swipées, classées comme le top 8 : score de
   * compatibilité + bonus du like / super like. Les « pass » viennent
   * ensuite, sans place dans le classement.
   */
  private async swipeRows(userId: string): Promise<ExportRow[]> {
    const [universities, swipes, scoring] = await Promise.all([
      this.activeUniversities(),
      this.swipes.actionsByUniversity(userId),
      this.preferences.findByUser(userId).then(
        (prefs) => prefs.scoring,
        (err: unknown) => withoutPreferences(err),
      ),
    ]);
    return rankSwiped(universities, swipes, scoring);
  }

  private activeUniversities(): Promise<University[]> {
    return this.prisma.university.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }
}

/** Classe les universités swipées (fonction pure, testée). */
export function rankSwiped(
  universities: University[],
  swipes: Map<string, SwipeAction>,
  scoring: ScoringPreferences | null,
): ExportRow[] {
  const swiped = universities
    .filter((uni) => swipes.has(uni.id))
    .map((uni) => {
      const summary = toSummary(uni);
      const swipe = swipes.get(uni.id) ?? null;
      const score =
        scoring === null ? null : scoreUniversity(scoring, summary).score;
      // Pass : rankScore null → classé après tous les likes.
      return { uni, swipe, score, key: rankScore(score, swipe) };
    })
    .sort(
      (a, b) =>
        (b.key ?? -Infinity) - (a.key ?? -Infinity) ||
        (b.score ?? -1) - (a.score ?? -1) ||
        a.uni.name.localeCompare(b.uni.name),
    );

  let position = 0;
  return swiped.map(({ uni, swipe, score, key }) =>
    toRow(uni, key === null ? null : ++position, score, swipe),
  );
}

function toRow(
  uni: University,
  rank: number | null,
  score: number | null,
  swipe: SwipeAction | null,
): ExportRow {
  return {
    university: { ...toSummary(uni), sourceUpdatedAt: uni.sourceUpdatedAt },
    rank,
    score,
    swipe,
  };
}

/** Pas de préférences (404) : export sans score ; sinon, on relance. */
function withoutPreferences(err: unknown): null {
  if (err instanceof NotFoundException) return null;
  throw err;
}
