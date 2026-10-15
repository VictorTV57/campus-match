import { matchesFilters } from './filters';
import type { FilterableUniversity } from './filters';

function uni(
  overrides: Partial<FilterableUniversity> = {},
): FilterableUniversity {
  return {
    country: 'Japan',
    language: 'English',
    specializations: ['Security', 'Networks'],
    extraChargeEur: 1000,
    gpaMin: 2.5,
    semester: 'Full-year or semester',
    doubleDiploma: false,
    erasmus: true,
    spots: 3,
    ...overrides,
  };
}

describe('matchesFilters', () => {
  it('aucun filtre : tout passe', () => {
    expect(matchesFilters(uni(), {})).toBe(true);
  });

  it('listes vides : ne filtrent rien', () => {
    expect(
      matchesFilters(uni(), {
        countries: [],
        languages: [],
        specializations: [],
      }),
    ).toBe(true);
  });

  it('pays et langue : appartenance, sans tenir compte de la casse', () => {
    expect(matchesFilters(uni(), { countries: [' japan ', 'Canada'] })).toBe(
      true,
    );
    expect(matchesFilters(uni(), { countries: ['Canada'] })).toBe(false);
    expect(matchesFilters(uni(), { languages: ['ENGLISH'] })).toBe(true);
    expect(matchesFilters(uni(), { languages: ['French'] })).toBe(false);
  });

  it('spécialisations : au moins une en commun', () => {
    expect(matchesFilters(uni(), { specializations: ['AI', 'security'] })).toBe(
      true,
    );
    expect(matchesFilters(uni(), { specializations: ['AI'] })).toBe(false);
    expect(
      matchesFilters(uni({ specializations: [] }), { specializations: ['AI'] }),
    ).toBe(false);
  });

  it('budget : frais pile au maximum acceptés, au-delà refusés', () => {
    expect(matchesFilters(uni(), { maxCharge: 1000 })).toBe(true);
    expect(matchesFilters(uni(), { maxCharge: 999 })).toBe(false);
    expect(matchesFilters(uni({ extraChargeEur: 0 }), { maxCharge: 0 })).toBe(
      true,
    );
  });

  it('GPA : exigence atteinte ou absente', () => {
    expect(matchesFilters(uni(), { gpa: 2.5 })).toBe(true);
    expect(matchesFilters(uni(), { gpa: 2.4 })).toBe(false);
    expect(matchesFilters(uni({ gpaMin: null }), { gpa: 0 })).toBe(true);
  });

  it('durée : "Full-year or semester" convient aux deux', () => {
    expect(matchesFilters(uni(), { semester: 'semester' })).toBe(true);
    expect(matchesFilters(uni(), { semester: 'full-year' })).toBe(true);
    expect(
      matchesFilters(uni({ semester: 'Full-year only' }), {
        semester: 'semester',
      }),
    ).toBe(false);
  });

  it('double diplôme : true exige, false ou absent ne filtre pas', () => {
    expect(matchesFilters(uni(), { doubleDiploma: true })).toBe(false);
    expect(
      matchesFilters(uni({ doubleDiploma: true }), { doubleDiploma: true }),
    ).toBe(true);
    expect(matchesFilters(uni(), { doubleDiploma: false })).toBe(true);
  });

  it('Erasmus+ : true exige, false exclut, absent ne filtre pas', () => {
    expect(matchesFilters(uni(), { erasmus: true })).toBe(true);
    expect(matchesFilters(uni(), { erasmus: false })).toBe(false);
    expect(matchesFilters(uni({ erasmus: false }), { erasmus: false })).toBe(
      true,
    );
    expect(matchesFilters(uni({ erasmus: false }), {})).toBe(true);
  });

  it('places minimum : pile au seuil acceptée, en dessous refusée', () => {
    expect(matchesFilters(uni({ spots: 3 }), { minSpots: 3 })).toBe(true);
    expect(matchesFilters(uni({ spots: 2 }), { minSpots: 3 })).toBe(false);
    expect(matchesFilters(uni({ spots: 50 }), { minSpots: 3 })).toBe(true);
  });

  it('plusieurs filtres : tous doivent passer', () => {
    const filters = { countries: ['Japan'], maxCharge: 500 };
    expect(matchesFilters(uni(), filters)).toBe(false);
    expect(matchesFilters(uni({ extraChargeEur: 500 }), filters)).toBe(true);
  });
});
