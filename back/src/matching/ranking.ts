import type { SwipeAction } from '../swipes/swipes.types';

/**
 * Bonus ajouté au score de compatibilité pour classer le top 8. Un bonus
 * plutôt qu'un tri par catégorie : un like ne fait pas passer une université
 * peu compatible devant une très compatible, il départage les proches.
 */
export const SWIPE_BONUS: Readonly<
  Record<Exclude<SwipeAction, 'pass'>, number>
> = { like: 0.1, superlike: 0.25 };

/**
 * Clé de tri du classement : null = exclue du top (pass explicite).
 * Un score null (aucun critère évaluable) compte comme 0.
 * Peut dépasser 1 : ce n'est pas un pourcentage, seulement un ordre.
 */
export function rankScore(
  score: number | null,
  swipe: SwipeAction | null,
): number | null {
  if (swipe === 'pass') return null;
  const base = score ?? 0;
  return swipe === null ? base : base + SWIPE_BONUS[swipe];
}
