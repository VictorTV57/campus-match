import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** "a,b" ou ?x=a&x=b → ['a', 'b'] (valeurs vides retirées). */
const toList = ({ value }: { value: unknown }) =>
  (Array.isArray(value) ? value : [value])
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter((v) => v !== '');

function ListParam(): PropertyDecorator {
  return (target, key) => {
    for (const decorator of [
      IsOptional(),
      Transform(toList),
      IsArray(),
      ArrayMaxSize(100),
      IsString({ each: true }),
      IsNotEmpty({ each: true }),
      MaxLength(100, { each: true }),
    ]) {
      decorator(target, key);
    }
  };
}

export const SEMESTER_FILTERS = ['full-year', 'semester'] as const;

/**
 * Query de GET /ranking/top8 : filtres appliqués avant la coupe à 8
 * (voir matching/filters.ts). Ex. ?countries=Japan,Canada&maxCharge=3000
 */
export class TopQueryDto {
  @ListParam()
  countries?: string[];

  @ListParam()
  languages?: string[];

  @ListParam()
  specializations?: string[];

  /** Frais supplémentaires maximum, en euros. */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'maxCharge doit être un entier (en euros)' })
  @Min(0, { message: 'maxCharge ne peut pas être négatif' })
  maxCharge?: number;

  /** GPA de l'élève, sur 4. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'gpa doit être un nombre' },
  )
  @Min(0, { message: 'gpa ne peut pas être négatif' })
  @Max(4, { message: 'gpa est sur 4' })
  gpa?: number;

  @IsOptional()
  @IsIn(SEMESTER_FILTERS, {
    message: `semester doit valoir ${SEMESTER_FILTERS.join(' | ')}`,
  })
  semester?: (typeof SEMESTER_FILTERS)[number];

  /** ?doubleDiploma=true : seulement les universités avec double diplôme. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'doubleDiploma doit valoir true ou false' })
  doubleDiploma?: boolean;

  /** ?erasmus=true (seulement Erasmus+) ou false (seulement hors Erasmus+). */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'erasmus doit valoir true ou false' })
  erasmus?: boolean;

  /** Nombre minimum de places, ex. 3 pour partir à trois. */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'minSpots doit être un entier' })
  @Min(1, { message: 'minSpots doit valoir au moins 1' })
  @Max(1000, { message: 'minSpots est trop grand' })
  minSpots?: number;
}
