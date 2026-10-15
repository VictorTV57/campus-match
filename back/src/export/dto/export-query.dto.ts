import { IsIn, IsOptional } from 'class-validator';
import {
  EXPORT_KINDS,
  EXPORT_LANGS,
  type ExportKind,
  type ExportLang,
} from '../export.columns';

export const EXPORT_FORMATS = ['csv', 'xlsx'] as const;

/** Query de GET /export/universities. */
export class ExportQueryDto {
  /** catalog = toutes les universités ; swipes = mes swipes, classés. */
  @IsIn(EXPORT_KINDS, {
    message: `kind doit valoir ${EXPORT_KINDS.join(' | ')}`,
  })
  kind!: ExportKind;

  @IsIn(EXPORT_FORMATS, {
    message: `format doit valoir ${EXPORT_FORMATS.join(' | ')}`,
  })
  format!: (typeof EXPORT_FORMATS)[number];

  /** Langue des en-têtes et libellés (défaut : fr). */
  @IsOptional()
  @IsIn(EXPORT_LANGS, {
    message: `lang doit valoir ${EXPORT_LANGS.join(' | ')}`,
  })
  lang?: ExportLang;
}
