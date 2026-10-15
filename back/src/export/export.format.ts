import { Workbook, type Fill } from 'exceljs';
import type { SwipeAction } from '../swipes/swipes.types';
import type {
  CellValue,
  ExportColumn,
  ExportLang,
  ExportRow,
} from './export.columns';

/** Séparateur CSV attendu par Excel selon la langue du système. */
const CSV_SEPARATOR: Record<ExportLang, string> = { fr: ';', en: ',' };
/** BOM UTF-8 : sans lui, Excel lit les accents de travers. */
const BOM = String.fromCharCode(0xfeff);

function cellText(value: CellValue): string {
  if (value === null) return '';
  if (typeof value === 'object') return value.hyperlink;
  return String(value);
}

function escapeCsv(text: string, separator: string): string {
  return /["\r\n]/.test(text) || text.includes(separator)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

/** CSV (pas de couleurs : le swipe reste lisible dans sa colonne). */
export function toCsv(
  rows: ExportRow[],
  columns: ExportColumn[],
  lang: ExportLang,
): string {
  const separator = CSV_SEPARATOR[lang];
  const line = (cells: string[]) =>
    cells.map((c) => escapeCsv(c, separator)).join(separator);
  const header = line(columns.map((c) => c.header[lang]));
  const body = rows.map((row) =>
    line(columns.map((c) => cellText(c.value(row, lang)))),
  );
  return BOM + [header, ...body].join('\r\n') + '\r\n';
}

const NAVY = 'FF14213D';
const CREAM = 'FFF7F4EE';
const LINK_BLUE = 'FF0563C1';

/** Fond des lignes selon le swipe : vert like, or super like, rouge pass. */
export const SWIPE_FILLS: Record<SwipeAction, string> = {
  like: 'FFC6EFCE',
  superlike: 'FFFFD966',
  pass: 'FFFFC7CE',
};

const solid = (argb: string): Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

/**
 * Classeur Excel : en-têtes figés et colorés, filtre automatique sur
 * chaque colonne, liens cliquables, et lignes colorées selon le swipe.
 */
export async function toXlsx(
  rows: ExportRow[],
  columns: ExportColumn[],
  lang: ExportLang,
): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = 'CampusMatch';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(
    lang === 'fr' ? 'Universités' : 'Universities',
    { views: [{ state: 'frozen', ySplit: 1 }] },
  );

  sheet.columns = columns.map((column, i) => ({
    key: String(i),
    header: column.header[lang],
    width: column.width,
    style: column.numFmt === undefined ? {} : { numFmt: column.numFmt },
  }));

  for (const row of rows) {
    const values = columns.map((column) => column.value(row, lang));
    const added = sheet.addRow(values);
    if (row.swipe !== null) {
      // Cellule par cellule : le fill d'une ligne entière déborderait
      // au-delà du tableau.
      for (let i = 1; i <= columns.length; i++) {
        added.getCell(i).fill = solid(SWIPE_FILLS[row.swipe]);
      }
    }
    // Liens en bleu souligné, comme Excel le fait pour une saisie manuelle.
    values.forEach((value, i) => {
      if (value !== null && typeof value === 'object') {
        added.getCell(i + 1).font = {
          color: { argb: LINK_BLUE },
          underline: true,
        };
      }
    });
  }

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: CREAM } };
  header.fill = solid(NAVY);
  header.alignment = { vertical: 'middle', wrapText: true };
  header.height = 32;

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
