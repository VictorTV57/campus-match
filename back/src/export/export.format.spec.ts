import type { University } from '@prisma/client';
import { Workbook } from 'exceljs';
import type { ScoringPreferences } from '../preferences/preferences.types';
import type { SwipeAction } from '../swipes/swipes.types';
import { columnsFor, type ExportRow } from './export.columns';
import { SWIPE_FILLS, toCsv, toXlsx } from './export.format';
import { rankSwiped } from './export.service';

function university(overrides: Partial<University> = {}): University {
  return {
    id: 'uuid-121',
    myaId: 121,
    name: 'AGH University',
    country: 'Poland',
    language: 'English',
    gpaMin: null,
    spots: 5,
    doubleDiploma: true,
    erasmus: true,
    semester: 'Full-year or semester',
    extraChargeEur: 1500,
    specializations: '["Security","Networks"]',
    images: '[]',
    overview: '',
    administrative: '',
    accommodation: '',
    courses: '',
    cost: '',
    active: true,
    sourceUpdatedAt: new Date('2026-09-22T09:45:26Z'),
    syncedAt: new Date(0),
    ...overrides,
  };
}

/** Ligne d'export déjà classée (pour tester le formatage seul). */
function row(overrides: Partial<ExportRow> = {}): ExportRow {
  return {
    rank: 1,
    score: 0.876,
    swipe: 'superlike',
    university: {
      id: 'uuid-121',
      myaId: 121,
      name: 'AGH University',
      country: 'Poland',
      language: 'English',
      extraChargeEur: 1500,
      gpaMin: null,
      semester: 'Full-year or semester',
      spots: 5,
      doubleDiploma: true,
      erasmus: true,
      specializations: ['Security', 'Networks'],
      images: [],
      sourceUpdatedAt: new Date('2026-09-22T09:45:26Z'),
    },
    ...overrides,
  };
}

const BOM = String.fromCharCode(0xfeff);
const lines = (csv: string) => csv.slice(BOM.length).trim().split('\r\n');

describe('toCsv', () => {
  it('catalogue : toutes les données, aucune colonne personnelle', () => {
    const csv = toCsv([row()], columnsFor('catalog'), 'fr');
    expect(csv.startsWith(BOM)).toBe(true);
    const [header, first] = lines(csv);
    expect(header).not.toMatch(/Classement|Mon swipe|Mon score/);
    expect(first).toBe(
      'AGH University;121;Poland;English;Security, Networks;1500;;Année ou semestre;Oui;Oui;5;https://mya.epitech.eu/university/121;2026-09-22',
    );
  });

  it('swipes : classement, swipe et score en premières colonnes', () => {
    const [header, first] = lines(toCsv([row()], columnsFor('swipes'), 'fr'));
    expect(header.startsWith('Classement;Mon swipe;Mon score;Université')).toBe(
      true,
    );
    expect(first.startsWith('1;Super like;0.88;AGH University;')).toBe(true);
  });

  it('anglais : séparateur ",", libellés traduits, guillemets si besoin', () => {
    const [header, first] = lines(toCsv([row()], columnsFor('catalog'), 'en'));
    expect(header.startsWith('University,mya ID,Country')).toBe(true);
    expect(first).toContain(',"Security, Networks",');
    expect(first).toContain(',Full year or semester,Yes,Yes,');
  });

  it('échappe guillemets et séparateurs', () => {
    const named = row();
    named.university.name = 'Uni "A"; B';
    const [, first] = lines(toCsv([named], columnsFor('catalog'), 'fr'));
    expect(first.startsWith('"Uni ""A""; B";')).toBe(true);
  });
});

describe('rankSwiped', () => {
  const prefs: ScoringPreferences = {
    budgetMax: null,
    countries: ['Poland'],
    languages: ['English'],
    studyFields: [],
    userGpa: null,
    semesterPref: null,
    wantsDoubleDiploma: false,
    erasmusPref: null,
    minSpots: null,
    strictMode: false,
  };
  const unis = [
    university({ id: 'a', name: 'A — like, pays OK' }),
    university({ id: 'b', name: 'B — pass' }),
    university({ id: 'c', name: 'C — super like, pays KO', country: 'Japan' }),
    university({ id: 'd', name: 'D — pas swipée' }),
    university({ id: 'e', name: 'E — like, pays KO', country: 'Japan' }),
  ];
  const swipes = new Map<string, SwipeAction>([
    ['a', 'like'],
    ['b', 'pass'],
    ['c', 'superlike'],
    ['e', 'like'],
  ]);

  it('seulement les universités swipées, classées score + bonus, pass à la fin', () => {
    const rows = rankSwiped(unis, swipes, prefs);
    // A : 1 + 0.10 ; C : 3/8 + 0.25 ; E : 3/8 + 0.10 ; B : pass
    expect(rows.map((r) => r.university.id)).toEqual(['a', 'c', 'e', 'b']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, null]);
    expect(rows.map((r) => r.swipe)).toEqual([
      'like',
      'superlike',
      'like',
      'pass',
    ]);
  });

  it('sans préférences : score vide, super like avant like', () => {
    const rows = rankSwiped(unis, swipes, null);
    expect(rows[0].university.id).toBe('c');
    expect(rows.every((r) => r.score === null)).toBe(true);
  });

  it('aucun swipe : tableur vide', () => {
    expect(rankSwiped(unis, new Map(), prefs)).toEqual([]);
  });
});

describe('toXlsx', () => {
  async function read(buffer: Buffer) {
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    return workbook.worksheets[0];
  }

  it('en-têtes, filtre automatique, lien cliquable', async () => {
    const sheet = await read(
      await toXlsx([row({ swipe: null })], columnsFor('catalog'), 'fr'),
    );
    expect(sheet.name).toBe('Universités');
    expect(sheet.getRow(1).getCell(1).value).toBe('Université');
    expect(sheet.autoFilter).toBeDefined();
    expect(sheet.getRow(2).getCell(12).value).toMatchObject({
      hyperlink: 'https://mya.epitech.eu/university/121',
    });
  });

  it('lignes colorées selon le swipe : vert, or, rouge', async () => {
    const rows = (['like', 'superlike', 'pass'] as const).map((swipe) =>
      row({ swipe }),
    );
    const sheet = await read(await toXlsx(rows, columnsFor('swipes'), 'fr'));
    const fill = (rowNumber: number, col: number) =>
      (
        sheet.getRow(rowNumber).getCell(col).fill as {
          fgColor?: { argb?: string };
        }
      ).fgColor?.argb;
    expect(fill(2, 1)).toBe(SWIPE_FILLS.like);
    expect(fill(3, 5)).toBe(SWIPE_FILLS.superlike);
    expect(fill(4, 16)).toBe(SWIPE_FILLS.pass);
    expect(sheet.getColumn(3).numFmt).toBe('0%');
  });
});
