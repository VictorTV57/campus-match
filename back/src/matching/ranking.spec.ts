import { rankScore, SWIPE_BONUS } from './ranking';

describe('rankScore', () => {
  it('sans swipe : le score de compatibilité tel quel', () => {
    expect(rankScore(0.7, null)).toBe(0.7);
  });

  it('pass : exclue du classement, quel que soit le score', () => {
    expect(rankScore(1, 'pass')).toBeNull();
    expect(rankScore(null, 'pass')).toBeNull();
  });

  it('like et super like ajoutent leur bonus', () => {
    expect(rankScore(0.5, 'like')).toBeCloseTo(0.5 + SWIPE_BONUS.like);
    expect(rankScore(0.5, 'superlike')).toBeCloseTo(
      0.5 + SWIPE_BONUS.superlike,
    );
  });

  it('super like > like > rien, à score égal', () => {
    const s = 0.6;
    expect(rankScore(s, 'superlike')!).toBeGreaterThan(rankScore(s, 'like')!);
    expect(rankScore(s, 'like')!).toBeGreaterThan(rankScore(s, null)!);
  });

  it('score null (aucun critère évaluable) compte comme 0', () => {
    expect(rankScore(null, null)).toBe(0);
    expect(rankScore(null, 'like')).toBe(SWIPE_BONUS.like);
  });
});
