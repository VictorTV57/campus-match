import { Injectable } from '@nestjs/common';
import { PreferencesService } from '../preferences/preferences.service';
import { PrismaService } from '../prisma/prisma.service';
import { SwipesService } from '../swipes/swipes.service';
import type { SwipeAction } from '../swipes/swipes.types';
import {
  toDetail,
  toSummary,
  type UniversityDetail,
  type UniversitySummary,
} from '../universities/university.mapper';
import { matchesFilters, type RankingFilters } from './filters';
import { rankScore } from './ranking';
import { scoreUniversity, type ScoreResult } from './scoring';

/** Nombre de vœux classés que l'élève soumet à Epitech. */
export const TOP_SIZE = 8;
export const DECK_DEFAULT_SIZE = 10;

export interface RankedUniversity extends ScoreResult {
  rank: number;
  /** Clé de tri : score + bonus de swipe (voir ranking.ts). */
  rankScore: number;
  swipe: SwipeAction | null;
  university: UniversitySummary;
}

export interface DeckCard extends ScoreResult {
  university: UniversityDetail;
}

export interface Deck {
  cards: DeckCard[];
  /** Universités restant à swiper (mode strict compris). */
  remaining: number;
}

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preferences: PreferencesService,
    private readonly swipes: SwipesService,
  ) {}

  /**
   * Les `size` universités actives les mieux classées : score de
   * compatibilité ajusté par les swipes, celles « passées » exclues.
   * `filters` (optionnel) retire les universités qui ne passent pas, avant
   * la coupe : on obtient bien les `size` meilleures parmi les restantes.
   * 404 (via PreferencesService) si l'utilisateur n'a pas de préférences.
   */
  async top(
    userId: string,
    {
      size = TOP_SIZE,
      filters = {},
    }: { size?: number; filters?: RankingFilters } = {},
  ): Promise<RankedUniversity[]> {
    const [scored, swipes] = await Promise.all([
      this.scoreCandidates(userId),
      this.swipes.actionsByUniversity(userId),
    ]);
    return scored
      .filter(({ summary }) => matchesFilters(summary, filters))
      .map(({ uni, result }) => {
        const swipe = swipes.get(uni.id) ?? null;
        return { uni, result, swipe, key: rankScore(result.score, swipe) };
      })
      .filter(
        (item): item is typeof item & { key: number } => item.key !== null,
      )
      .sort(
        (a, b) =>
          b.key - a.key ||
          (b.result.score ?? -1) - (a.result.score ?? -1) ||
          a.uni.name.localeCompare(b.uni.name),
      )
      .slice(0, size)
      .map(({ uni, result, swipe, key }, i) => ({
        rank: i + 1,
        rankScore: key,
        swipe,
        ...result,
        university: toSummary(uni),
      }));
  }

  /**
   * Prochaines cartes à swiper : universités pas encore swipées, les plus
   * compatibles d'abord (c'est là que l'avis compte le plus).
   */
  async deck(userId: string, size = DECK_DEFAULT_SIZE): Promise<Deck> {
    const [scored, swipes] = await Promise.all([
      this.scoreCandidates(userId),
      this.swipes.actionsByUniversity(userId),
    ]);
    const unswiped = scored.filter(({ uni }) => !swipes.has(uni.id));

    return {
      cards: unswiped
        .sort(
          (a, b) =>
            (b.result.score ?? -1) - (a.result.score ?? -1) ||
            a.uni.name.localeCompare(b.uni.name),
        )
        .slice(0, size)
        .map(({ uni, result }) => ({ ...result, university: toDetail(uni) })),
      remaining: unswiped.length,
    };
  }

  /**
   * Universités actives scorées. En mode strict, seules celles qui
   * respectent entièrement chaque critère renseigné sont gardées.
   */
  private async scoreCandidates(userId: string) {
    const { scoring } = await this.preferences.findByUser(userId);
    const universities = await this.prisma.university.findMany({
      where: { active: true },
    });
    return universities
      .map((uni) => {
        const summary = toSummary(uni);
        return { uni, summary, result: scoreUniversity(scoring, summary) };
      })
      .filter(({ result }) => !scoring.strictMode || result.strictMatch);
  }
}
