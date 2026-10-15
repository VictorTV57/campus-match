import type { Prisma } from '@prisma/client';
import { MYA_BASE_URL, type MyaUniversity, type MyaYesNo } from './mya.types';

/** Colonnes University écrites par le sync (tout sauf id, relations, syncedAt). */
export type UniversitySyncData = Omit<
  Prisma.UniversityCreateInput,
  'id' | 'swipes' | 'socialMatches' | 'syncedAt'
>;

export function toUniversityData(mya: MyaUniversity): UniversitySyncData {
  return {
    myaId: mya.id,
    name: mya.name.trim(),
    country: mya.country.trim(),
    language: mya.language.trim(),
    gpaMin: mya.gpa === 0 ? null : mya.gpa,
    spots: mya.spots,
    doubleDiploma: yesNo(mya.diploma),
    erasmus: yesNo(mya.erasmus),
    semester: mya.semester,
    extraChargeEur: mya.extracharge,
    specializations: JSON.stringify(mya.specializations.map((s) => s.trim())),
    images: JSON.stringify(
      [mya.image1, mya.image2, mya.image3]
        .filter((file): file is string => file !== null && file.trim() !== '')
        .map(toUploadUrl),
    ),
    overview: htmlToRichText(mya.overview),
    administrative: htmlToRichText(mya.administrative),
    accommodation: htmlToRichText(mya.accomodation),
    courses: htmlToRichText(mya.courses),
    cost: htmlToRichText(mya.cost),
    // Une fiche masquée côté Epitech est traitée comme une fiche retirée.
    active: yesNo(mya.display),
    sourceUpdatedAt: new Date(mya.updatedAt),
  };
}

function yesNo(value: MyaYesNo): boolean {
  return value === 'YES';
}

function toUploadUrl(file: string): string {
  return `${MYA_BASE_URL}/uploads/${encodeURIComponent(file.trim())}`;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  euro: '€',
};

/**
 * Convertit le HTML des fiches mya en texte enrichi minimal, rendu par le
 * front (front/src/components/RichText.tsx, analysé par richTextParser.ts). Seules constructions produites :
 *   - un bloc par ligne, "- " en début de ligne pour une puce ;
 *   - **gras** (titres et <strong>) ;
 *   - [libellé](url) pour un lien http(s) ou mailto ;
 *   - ![](src) seul sur sa ligne pour une image (data:image/… ou http(s)).
 * Toute autre balise est retirée ; un lien ou une image au schéma non
 * autorisé (javascript:, …) est réduit à son texte.
 */
export function htmlToRichText(html: string): string {
  return repairSourceTypos(html)
    .replace(/<img\b[^>]*>/gi, imageToMarkup)
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, linkToMarkup)
    .replace(
      /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]\s*>/gi,
      (_match, inner: string) => `\n${bold(inner)}\n`,
    )
    .replace(
      /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi,
      (_match, _tag, inner: string) => bold(inner),
    )
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*(ul|ol)[^>]*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '- ')
    .replace(/<\/\s*(p|div|li|ul|ol|tr|table|blockquote)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, decodeEntity)
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Bug de la source (constaté le 2026-10-14) : un rechercher-remplacer côté
 * Epitech a changé "em" en "italic" à l'intérieur des mots ("September" →
 * "Septitalicber", URL "akademik" → "akaditalicik"). On ne répare que
 * "italic" collé à une lettre : le mot "italic" isolé reste intact.
 */
function repairSourceTypos(html: string): string {
  return html.replace(/(?<=[a-z])italic|italic(?=[a-z])/gi, 'em');
}

const SAFE_LINK = /^(https?:\/\/|mailto:)/i;
const SAFE_IMAGE = /^(data:image\/(png|jpe?g|gif|webp);base64,|https?:\/\/)/i;

function attribute(attrs: string, name: string): string | null {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`,
    'i',
  ).exec(attrs);
  return match === null ? null : (match[2] ?? match[3]).trim();
}

/** Parenthèses et espaces encodés pour ne pas casser la syntaxe (url). */
function escapeUrl(url: string): string {
  return url.replace(/\s/g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function imageToMarkup(tag: string): string {
  const src = attribute(tag, 'src');
  return src !== null && SAFE_IMAGE.test(src)
    ? `\n![](${escapeUrl(src)})\n`
    : '';
}

function linkToMarkup(_match: string, attrs: string, inner: string): string {
  const href = attribute(attrs, 'href');
  const label = stripTags(inner)
    .replace(/[[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (href === null || !SAFE_LINK.test(href)) return label;
  return `[${label === '' ? href : label}](${escapeUrl(href)})`;
}

/** **texte**, en gardant les espaces autour (sinon "<b>Foo </b>bar" colle). */
function bold(inner: string): string {
  const text = stripTags(inner);
  const core = text.trim().replace(/\*\*/g, '');
  if (core === '') return text;
  const lead = /^\s*/.exec(text)?.[0] ?? '';
  const trail = /\s*$/.exec(text)?.[0] ?? '';
  return `${lead}**${core}**${trail}`;
}

function decodeEntity(match: string, entity: string): string {
  if (entity[0] === '#') {
    const code =
      entity[1].toLowerCase() === 'x'
        ? parseInt(entity.slice(2), 16)
        : parseInt(entity.slice(1), 10);
    return Number.isNaN(code) ? match : String.fromCodePoint(code);
  }
  return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
}
