import type { ScoringPreferences } from '../preferences/preferences.types';
import {
  CRITERION_WEIGHTS,
  scoreUniversity,
  type ScorableUniversity,
} from './scoring';

/** Préférences n'exprimant que pays + langue ; chaque test ajoute le reste. */
function prefs(
  overrides: Partial<ScoringPreferences> = {},
): ScoringPreferences {
  return {
    budgetMax: null,
    countries: ['Japan'],
    languages: ['English'],
    studyFields: [],
    wantsDoubleDiploma: false,
    erasmusPref: null,
    minSpots: null,
    strictMode: false,
    userGpa: null,
    semesterPref: null,
    ...overrides,
  };
}

function uni(overrides: Partial<ScorableUniversity> = {}): ScorableUniversity {
  return {
    country: 'Japan',
    language: 'English',
    specializations: ['Security', 'Networks'],
    extraChargeEur: 0,
    gpaMin: null,
    semester: 'Full-year or semester',
    doubleDiploma: false,
    erasmus: true,
    spots: 3,
    ...overrides,
  };
}

describe('scoreUniversity', () => {
  describe('règle d’exclusion', () => {
    it('aucune préférence : aucun critère évalué, score null (pas 0)', () => {
      const result = scoreUniversity(
        prefs({ countries: [], languages: [] }),
        uni(),
      );

      expect(result.score).toBeNull();
      for (const criterion of Object.values(result.breakdown)) {
        expect(criterion).toEqual({ included: false, reason: 'no-preference' });
      }
    });

    it('seuls pays + langue renseignés : la moyenne ne porte que sur eux', () => {
      const result = scoreUniversity(prefs(), uni({ country: 'Korea' }));

      // pays 0 (poids 5), langue 1 (poids 3) → 3/8
      expect(result.score).toBeCloseTo(3 / 8);
      expect(result.breakdown.specialization.included).toBe(false);
      expect(result.breakdown.budget.included).toBe(false);
      expect(result.breakdown.gpa.included).toBe(false);
      expect(result.breakdown.semester.included).toBe(false);
    });

    it('un critère exclu ne fait pas baisser le score', () => {
      const avecGpaSansDonnee = scoreUniversity(
        prefs({ userGpa: 2 }),
        uni({ gpaMin: null }),
      );
      expect(avecGpaSansDonnee.score).toBe(1);
    });
  });

  describe('gpa', () => {
    it('gpaMin null (pas d’exigence) : exclu pour absence de donnée', () => {
      const result = scoreUniversity(
        prefs({ userGpa: 3 }),
        uni({ gpaMin: null }),
      );
      expect(result.breakdown.gpa).toEqual({
        included: false,
        reason: 'no-data',
      });
    });

    it('userGpa null : exclu pour absence de préférence', () => {
      const result = scoreUniversity(prefs(), uni({ gpaMin: 2.5 }));
      expect(result.breakdown.gpa).toEqual({
        included: false,
        reason: 'no-preference',
      });
    });

    it('userGpa égal à gpaMin : 1', () => {
      const result = scoreUniversity(
        prefs({ userGpa: 2.5 }),
        uni({ gpaMin: 2.5 }),
      );
      expect(result.breakdown.gpa).toMatchObject({ included: true, score: 1 });
    });

    it('userGpa sous gpaMin : 0', () => {
      const result = scoreUniversity(
        prefs({ userGpa: 2.4 }),
        uni({ gpaMin: 2.5 }),
      );
      expect(result.breakdown.gpa).toMatchObject({ included: true, score: 0 });
    });
  });

  describe('budget', () => {
    const budgetScore = (budgetMax: number | null, extraChargeEur: number) =>
      scoreUniversity(prefs({ budgetMax }), uni({ extraChargeEur })).breakdown
        .budget;

    it('pile à la limite : 1', () => {
      expect(budgetScore(5000, 5000)).toMatchObject({
        included: true,
        score: 1,
      });
    });

    it('sous la limite : 1', () => {
      expect(budgetScore(5000, 0)).toMatchObject({ score: 1 });
    });

    it('décroissance linéaire entre budgetMax et 2 × budgetMax', () => {
      expect(budgetScore(5000, 6250)).toMatchObject({ score: 0.75 });
      expect(budgetScore(5000, 7500)).toMatchObject({ score: 0.5 });
    });

    it('pile à 2 × budgetMax : 0', () => {
      expect(budgetScore(5000, 10000)).toMatchObject({ score: 0 });
    });

    it('au-delà de 2 × budgetMax : 0, jamais négatif', () => {
      expect(budgetScore(5000, 50000)).toMatchObject({ score: 0 });
    });

    it('budgetMax 0 : 1 si gratuit, 0 sinon (pas de division par 0)', () => {
      expect(budgetScore(0, 0)).toMatchObject({ score: 1 });
      expect(budgetScore(0, 1)).toMatchObject({ score: 0 });
    });

    it('budgetMax null : exclu', () => {
      expect(budgetScore(null, 9300)).toEqual({
        included: false,
        reason: 'no-preference',
      });
    });
  });

  describe('semestre', () => {
    const semesterScore = (
      semesterPref: ScoringPreferences['semesterPref'],
      semester: string,
    ) =>
      scoreUniversity(prefs({ semesterPref }), uni({ semester })).breakdown
        .semester;

    it('incompatible : 0', () => {
      expect(semesterScore('semester', 'Full-year only')).toMatchObject({
        included: true,
        score: 0,
      });
      expect(semesterScore('full-year', 'Semester only')).toMatchObject({
        score: 0,
      });
    });

    it('compatible : 1, "Full-year or semester" convient aux deux', () => {
      expect(semesterScore('full-year', 'Full-year only')).toMatchObject({
        score: 1,
      });
      expect(semesterScore('semester', 'Semester only')).toMatchObject({
        score: 1,
      });
      expect(semesterScore('full-year', 'Full-year or semester')).toMatchObject(
        {
          score: 1,
        },
      );
      expect(semesterScore('semester', 'Full-year or semester')).toMatchObject({
        score: 1,
      });
    });

    it('"any" ou null : exclu', () => {
      expect(semesterScore('any', 'Full-year only')).toEqual({
        included: false,
        reason: 'no-preference',
      });
      expect(semesterScore(null, 'Full-year only')).toEqual({
        included: false,
        reason: 'no-preference',
      });
    });

    it('valeur inconnue côté université : exclu pour absence de donnée', () => {
      expect(semesterScore('semester', 'Trimester')).toEqual({
        included: false,
        reason: 'no-data',
      });
    });
  });

  describe('pays, langue, spécialisation', () => {
    it('comparaison insensible à la casse et aux espaces', () => {
      const result = scoreUniversity(
        prefs({
          countries: [' japan '],
          languages: ['ENGLISH'],
          studyFields: ['security'],
        }),
        uni(),
      );
      expect(result.score).toBe(1);
    });

    it('spécialisation absente de la liste : 0', () => {
      const result = scoreUniversity(
        prefs({ studyFields: ['Robotics'] }),
        uni(),
      );
      expect(result.breakdown.specialization).toMatchObject({ score: 0 });
    });

    it('université sans spécialisation connue : exclu pour absence de donnée', () => {
      const result = scoreUniversity(
        prefs({ studyFields: ['Security'] }),
        uni({ specializations: [] }),
      );
      expect(result.breakdown.specialization).toEqual({
        included: false,
        reason: 'no-data',
      });
    });

    it('plusieurs spécialisations : part de celles proposées', () => {
      const spec = (studyFields: string[]) =>
        scoreUniversity(
          prefs({ studyFields }),
          uni({ specializations: ['Security', 'Networks'] }),
        ).breakdown.specialization;

      expect(spec(['Security', 'Networks', 'AI'])).toMatchObject({
        score: 2 / 3,
      });
      expect(spec(['Security', 'AI'])).toMatchObject({ score: 0.5 });
      expect(spec(['AI', 'Robotics'])).toMatchObject({ score: 0 });
    });

    it('doublons et casse ne faussent pas la proportion', () => {
      const result = scoreUniversity(
        prefs({ studyFields: ['Security', 'security ', 'AI'] }),
        uni({ specializations: ['Security'] }),
      );
      expect(result.breakdown.specialization).toMatchObject({ score: 0.5 });
    });

    it('liste vide : pas de préférence', () => {
      const result = scoreUniversity(prefs({ studyFields: [] }), uni());
      expect(result.breakdown.specialization).toEqual({
        included: false,
        reason: 'no-preference',
      });
    });
  });

  describe('double diplôme', () => {
    const dd = (wants: boolean, offered: boolean) =>
      scoreUniversity(
        prefs({ wantsDoubleDiploma: wants }),
        uni({ doubleDiploma: offered }),
      );

    it('non souhaité : critère exclu, quel que soit l’université', () => {
      expect(dd(false, true).breakdown.doubleDiploma).toEqual({
        included: false,
        reason: 'no-preference',
      });
      expect(dd(false, false).score).toBe(dd(false, true).score);
    });

    it('souhaité : 1 si proposé, 0 sinon, avec son poids', () => {
      expect(dd(true, true).breakdown.doubleDiploma).toEqual({
        included: true,
        score: 1,
        weight: CRITERION_WEIGHTS.doubleDiploma,
      });
      expect(dd(true, false).breakdown.doubleDiploma).toMatchObject({
        score: 0,
      });
      expect(dd(true, false).score).toBeLessThan(dd(true, true).score!);
    });

    it('souhaité : bloquant en mode strict', () => {
      expect(dd(true, false).strictMatch).toBe(false);
      expect(dd(true, true).strictMatch).toBe(true);
    });
  });

  describe('Erasmus+', () => {
    const er = (
      erasmusPref: ScoringPreferences['erasmusPref'],
      erasmus: boolean,
    ) =>
      scoreUniversity(prefs({ erasmusPref }), uni({ erasmus })).breakdown
        .erasmus;

    it('"yes" : 1 si Erasmus+, 0 sinon, avec son poids', () => {
      expect(er('yes', true)).toEqual({
        included: true,
        score: 1,
        weight: CRITERION_WEIGHTS.erasmus,
      });
      expect(er('yes', false)).toMatchObject({ score: 0 });
    });

    it('"no" : 1 si hors Erasmus+, 0 sinon', () => {
      expect(er('no', false)).toMatchObject({ score: 1 });
      expect(er('no', true)).toMatchObject({ score: 0 });
    });

    it('"any" ou null : exclu', () => {
      for (const pref of ['any', null] as const) {
        expect(er(pref, true)).toEqual({
          included: false,
          reason: 'no-preference',
        });
      }
    });
  });

  describe('places minimum', () => {
    const sp = (minSpots: number | null, spots: number) =>
      scoreUniversity(prefs({ minSpots }), uni({ spots }));

    it('pile au minimum : 1 ; en dessous : 0', () => {
      expect(sp(3, 3).breakdown.spots).toEqual({
        included: true,
        score: 1,
        weight: CRITERION_WEIGHTS.spots,
      });
      expect(sp(3, 2).breakdown.spots).toMatchObject({ score: 0 });
      expect(sp(3, 50).breakdown.spots).toMatchObject({ score: 1 });
    });

    it('non renseigné : exclu', () => {
      expect(sp(null, 1).breakdown.spots).toEqual({
        included: false,
        reason: 'no-preference',
      });
    });

    it('bloquant en mode strict, comme Erasmus+', () => {
      expect(sp(3, 2).strictMatch).toBe(false);
      expect(sp(3, 3).strictMatch).toBe(true);
      expect(
        scoreUniversity(prefs({ erasmusPref: 'yes' }), uni({ erasmus: false }))
          .strictMatch,
      ).toBe(false);
    });
  });

  describe('strictMatch (mode strict)', () => {
    const strict = (
      p: Partial<ScoringPreferences>,
      u: Partial<ScorableUniversity> = {},
    ) => scoreUniversity(prefs(p), uni(u)).strictMatch;

    it('tout respecté : true', () => {
      expect(
        strict(
          {
            budgetMax: 1000,
            studyFields: ['Security', 'AI'],
            userGpa: 3,
            semesterPref: 'full-year',
          },
          { extraChargeEur: 1000, gpaMin: 3 },
        ),
      ).toBe(true);
    });

    it('une seule spécialisation choisie proposée suffit', () => {
      expect(strict({ studyFields: ['Security', 'AI'] })).toBe(true);
      expect(strict({ studyFields: ['AI'] })).toBe(false);
    });

    it('pays ou langue non choisis : false', () => {
      expect(strict({}, { country: 'Korea' })).toBe(false);
      expect(strict({}, { language: 'French' })).toBe(false);
    });

    it('budget dépassé, même de peu : false', () => {
      expect(strict({ budgetMax: 1000 }, { extraChargeEur: 1001 })).toBe(false);
    });

    it('GPA insuffisant ou durée incompatible : false', () => {
      expect(strict({ userGpa: 2.4 }, { gpaMin: 2.5 })).toBe(false);
      expect(
        strict({ semesterPref: 'semester' }, { semester: 'Full-year only' }),
      ).toBe(false);
    });

    it('critères sans préférence ou sans donnée : ne bloquent pas', () => {
      expect(
        strict(
          { userGpa: 2, studyFields: ['AI'] },
          { gpaMin: null, specializations: [] },
        ),
      ).toBe(true);
    });
  });

  it('moyenne pondérée sur tous les critères', () => {
    const result = scoreUniversity(
      prefs({
        budgetMax: 5000,
        studyFields: ['Robotics'], // 0
        userGpa: 3,
        semesterPref: 'semester',
      }),
      uni({
        country: 'Korea', // 0
        extraChargeEur: 7500, // 0.5
        gpaMin: 2.5, // 1
        semester: 'Semester only', // 1
      }),
    );

    const w = CRITERION_WEIGHTS;
    const expected =
      (0 * w.country +
        1 * w.language +
        0 * w.specialization +
        0.5 * w.budget +
        1 * w.gpa +
        1 * w.semester) /
      (w.country +
        w.language +
        w.specialization +
        w.budget +
        w.gpa +
        w.semester);
    expect(result.score).toBeCloseTo(expected);
  });

  it('le score reste toujours entre 0 et 1', () => {
    const worst = scoreUniversity(
      prefs({
        budgetMax: 1,
        studyFields: ['X'],
        userGpa: 0,
        semesterPref: 'semester',
      }),
      uni({
        country: 'Korea',
        language: 'French',
        extraChargeEur: 99999,
        gpaMin: 4,
        semester: 'Full-year only',
      }),
    );
    expect(worst.score).toBe(0);
  });
});
