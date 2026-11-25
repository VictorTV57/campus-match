import { htmlToRichText, toUniversityData } from './mya.mapper';
import type { MyaUniversity } from './mya.types';
import { assertMyaUniversities, MyaShapeError } from './mya.validation';

function mya(overrides: Partial<MyaUniversity> = {}): MyaUniversity {
  return {
    id: 140,
    name: 'CSU San Marcos - Deferred Start',
    country: 'USA',
    gpa: 0,
    spots: 4,
    diploma: 'NO',
    language: 'English',
    extracharge: 2800,
    overview: '',
    administrative: '',
    accomodation: '',
    courses: '',
    cost: '',
    image1: 'a.png',
    image2: null,
    image3: null,
    erasmus: 'NO',
    semester: 'Full-year only',
    display: 'YES',
    suspended: 'NO',
    suspendedMonth: null,
    suspendedYear: null,
    updatedAt: '2026-10-17T14:35:38.238Z',
    specializations: [],
    ...overrides,
  };
}

describe('suspension', () => {
  it('suspendue : reste active, avec sa date', () => {
    expect(
      toUniversityData(
        mya({ suspended: 'YES', suspendedMonth: 9, suspendedYear: 2026 }),
      ),
    ).toMatchObject({
      active: true,
      suspended: true,
      suspendedMonth: 9,
      suspendedYear: 2026,
    });
  });

  it('non suspendue : la date résiduelle de mya est ignorée', () => {
    expect(
      toUniversityData(
        mya({ suspended: 'NO', suspendedMonth: 9, suspendedYear: 2026 }),
      ),
    ).toMatchObject({
      suspended: false,
      suspendedMonth: null,
      suspendedYear: null,
    });
  });

  it('valeurs hors format rejetées par la validation', () => {
    const check = (overrides: Record<string, unknown>) =>
      assertMyaUniversities([
        { expectedId: 140, data: { ...mya(), ...overrides } },
      ]);
    expect(check({ suspendedMonth: 12 })).toHaveLength(1);
    expect(() => check({ suspendedMonth: 13 })).toThrow(MyaShapeError);
    expect(() => check({ suspended: undefined })).toThrow(MyaShapeError);
  });
});

describe('htmlToRichText', () => {
  it('paragraphes, puces et entités', () => {
    expect(
      htmlToRichText('<p>A &amp; B</p><ul><li>un</li><li>deux</li></ul>'),
    ).toBe('A & B\n\n- un\n- deux');
  });

  it('liens http(s) et mailto conservés en [libellé](url)', () => {
    expect(
      htmlToRichText(
        '<p>Voir <a href="https://x.edu/a?b=1&amp;c=2" target="_blank">ici</a> ou <a href="mailto:x@y.fr">x@y.fr</a></p>',
      ),
    ).toBe('Voir [ici](https://x.edu/a?b=1&c=2) ou [x@y.fr](mailto:x@y.fr)');
  });

  it('lien sans libellé : l’URL sert de libellé', () => {
    expect(htmlToRichText('<a href="https://x.edu"></a>')).toBe(
      '[https://x.edu](https://x.edu)',
    );
  });

  it('schémas dangereux réduits au texte', () => {
    expect(htmlToRichText('<a href="javascript:alert(1)">clic</a>')).toBe(
      'clic',
    );
    expect(htmlToRichText('<img src="javascript:alert(1)">')).toBe('');
  });

  it('parenthèses et crochets ne cassent pas la syntaxe', () => {
    expect(htmlToRichText('<a href="https://x.edu/a (b)">[lien]</a>')).toBe(
      '[lien](https://x.edu/a%20%28b%29)',
    );
  });

  it('images intégrées sur leur propre ligne', () => {
    expect(
      htmlToRichText('<p>Coûts :<img src="data:image/png;base64,AAA="></p>'),
    ).toBe('Coûts :\n![](data:image/png;base64,AAA=)');
  });

  it('titres et <strong> en **gras**, espaces conservés', () => {
    expect(
      htmlToRichText('<h2>Logement</h2><p><strong>Prix </strong>bas</p>'),
    ).toBe('**Logement**\n**Prix** bas');
  });

  it('répare le bug source "em" → "italic" dans les mots, pas le mot seul', () => {
    expect(
      htmlToRichText(
        '<p>Septitalicber, <a href="https://akaditalicik.pl">ici</a>, italic font</p>',
      ),
    ).toBe('September, [ici](https://akademik.pl), italic font');
  });

  it('gras vide ignoré', () => {
    expect(htmlToRichText('<p>a<strong> </strong>b</p>')).toBe('a b');
  });
});
