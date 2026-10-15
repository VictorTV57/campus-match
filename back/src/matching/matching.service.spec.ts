import type { University } from '@prisma/client';
import type { PreferencesService } from '../preferences/preferences.service';
import type { PreferencesResponse } from '../preferences/preferences.types';
import type { PrismaService } from '../prisma/prisma.service';
import type { SwipesService } from '../swipes/swipes.service';
import type { SwipeAction } from '../swipes/swipes.types';
import { MatchingService } from './matching.service';

function university(
  myaId: number,
  overrides: Partial<University> = {},
): University {
  return {
    id: `uuid-${myaId}`,
    myaId,
    name: `Uni ${String(myaId).padStart(2, '0')}`,
    country: 'Japan',
    language: 'English',
    gpaMin: null,
    spots: 2,
    doubleDiploma: false,
    erasmus: false,
    semester: 'Full-year only',
    extraChargeEur: 0,
    specializations: '["Security"]',
    images: '[]',
    overview: '',
    administrative: '',
    accommodation: '',
    courses: '',
    cost: '',
    active: true,
    sourceUpdatedAt: new Date(0),
    syncedAt: new Date(0),
    ...overrides,
  };
}

const preferences: PreferencesResponse = {
  id: 'p',
  userId: 'u',
  scoring: {
    budgetMax: 1000,
    countries: ['Japan'],
    languages: ['English'],
    studyFields: [],
    wantsDoubleDiploma: false,
    erasmusPref: null,
    minSpots: null,
    strictMode: false,
    userGpa: null,
    semesterPref: null,
  },
  notes: {
    foodPref: null,
    socialPref: null,
    climatePref: null,
    housingType: null,
  },
};

function setup(
  universities: University[],
  swipes: Record<string, SwipeAction> = {},
  scoring: Partial<PreferencesResponse['scoring']> = {},
) {
  const findMany = jest.fn().mockResolvedValue(universities);
  const prisma = { university: { findMany } } as unknown as PrismaService;
  const prefsService = {
    findByUser: jest.fn().mockResolvedValue({
      ...preferences,
      scoring: { ...preferences.scoring, ...scoring },
    }),
  } as unknown as PreferencesService;
  const swipesService = {
    actionsByUniversity: jest
      .fn()
      .mockResolvedValue(new Map(Object.entries(swipes))),
  } as unknown as SwipesService;
  return {
    service: new MatchingService(prisma, prefsService, swipesService),
    findMany,
  };
}

/**
 * budget 1000 : extraCharge 1000, 1100, 1200, … → critère budget 1, 0.9,
 * 0.8, … donc scores strictement décroissants avec myaId.
 */
function decreasing(count: number): University[] {
  return Array.from({ length: count }, (_, i) =>
    university(i + 1, { extraChargeEur: 1000 + i * 100 }),
  );
}

describe('MatchingService.top', () => {
  it('ne charge que les universités actives', async () => {
    const { service, findMany } = setup([]);
    await service.top('u');
    expect(findMany).toHaveBeenCalledWith({ where: { active: true } });
  });

  it('renvoie au plus 8 universités, triées par score décroissant', async () => {
    const { service } = setup(decreasing(12).reverse());

    const top = await service.top('u');

    expect(top).toHaveLength(8);
    expect(top.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const scores = top.map((r) => r.score ?? -1);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(top[top.length - 1].university.myaId).toBe(8);
  });

  it('départage les égalités par nom', async () => {
    const { service } = setup([
      university(2, { name: 'Zeta' }),
      university(1, { name: 'Alpha' }),
    ]);
    const top = await service.top('u');
    expect(top.map((r) => r.university.name)).toEqual(['Alpha', 'Zeta']);
  });

  it('filtre par pays avant la coupe à 8, sans tenir compte de la casse', async () => {
    const korea = Array.from({ length: 3 }, (_, i) =>
      university(100 + i, { country: 'South Korea' }),
    );
    const { service } = setup([...decreasing(10), ...korea]);

    const top = await service.top('u', {
      filters: { countries: [' south korea '] },
    });

    expect(top.map((r) => r.university.myaId)).toEqual([100, 101, 102]);
    expect(top.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('liste de pays vide : pas de filtre', async () => {
    const { service } = setup(decreasing(3));
    expect(await service.top('u', { filters: { countries: [] } })).toHaveLength(
      3,
    );
  });

  it('exclut les universités « passées »', async () => {
    const { service } = setup(decreasing(3), { 'uuid-1': 'pass' });
    const top = await service.top('u');
    expect(top.map((r) => r.university.myaId)).toEqual([2, 3]);
  });

  it('un super like remonte une université proche, sans changer son score', async () => {
    // myaId 1-3 à score 1 ; myaId 5 : budget 0.6 → score (0.6×2 + 5 + 3) / 10
    // = 0.92, + 0.25 de super like = 1.17 > 1
    const unis = decreasing(8).map((u, i) =>
      i < 3 ? { ...u, extraChargeEur: 0 } : u,
    );
    const { service } = setup(unis, { 'uuid-5': 'superlike' });

    const [first] = await service.top('u');

    expect(first.university.myaId).toBe(5);
    expect(first.swipe).toBe('superlike');
    expect(first.score).toBeCloseTo((0.6 * 2 + 5 + 3) / 10);
    expect(first.rankScore).toBeCloseTo(first.score! + 0.25);
  });

  it('expose le détail par critère et les tableaux désérialisés', async () => {
    const { service } = setup([
      university(1, { images: '["https://mya.epitech.eu/uploads/a.jpg"]' }),
    ]);
    const [first] = await service.top('u');
    expect(first.university.specializations).toEqual(['Security']);
    expect(first.university.images).toEqual([
      'https://mya.epitech.eu/uploads/a.jpg',
    ]);
    expect(first.breakdown.budget).toEqual({
      included: true,
      score: 1,
      weight: 2,
    });
    expect(first.breakdown.gpa).toEqual({
      included: false,
      reason: 'no-preference',
    });
  });
});

describe('MatchingService.deck', () => {
  it('ne propose que les universités pas encore swipées, meilleures d’abord', async () => {
    const { service } = setup(decreasing(5).reverse(), {
      'uuid-1': 'like',
      'uuid-3': 'pass',
    });

    const { cards, remaining } = await service.deck('u', 10);

    expect(cards.map((c) => c.university.myaId)).toEqual([2, 4, 5]);
    expect(cards[0].university).toHaveProperty('overview');
    expect(remaining).toBe(3);
  });

  it('respecte la taille demandée, remaining compte tout le reste', async () => {
    const { service } = setup(decreasing(5));
    const { cards, remaining } = await service.deck('u', 2);
    expect(cards).toHaveLength(2);
    expect(remaining).toBe(5);
  });
});

describe('mode strict', () => {
  // budget 1000 : myaId 1 dans le budget, 2-3 au-dessus ; myaId 4 hors pays
  const unis = () => [
    ...decreasing(3),
    university(4, { country: 'Korea', extraChargeEur: 0 }),
  ];

  it('désactivé : tout est classé, strictMatch indique qui passerait', async () => {
    const { service } = setup(unis());
    const top = await service.top('u');
    expect(top).toHaveLength(4);
    expect(
      top.filter((r) => r.strictMatch).map((r) => r.university.myaId),
    ).toEqual([1]);
  });

  it('activé : top 8 réduit aux universités qui respectent tout', async () => {
    const { service } = setup(unis(), {}, { strictMode: true });
    const top = await service.top('u');
    expect(top.map((r) => r.university.myaId)).toEqual([1]);
  });

  it('activé : le paquet de swipe et son compteur aussi', async () => {
    const { service } = setup(unis(), {}, { strictMode: true });
    const { cards, remaining } = await service.deck('u');
    expect(cards.map((c) => c.university.myaId)).toEqual([1]);
    expect(remaining).toBe(1);
  });
});
