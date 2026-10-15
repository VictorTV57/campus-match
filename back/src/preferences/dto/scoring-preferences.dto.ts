import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  ERASMUS_PREFS,
  SEMESTER_PREFS,
  type ErasmusPref,
  type SemesterPref,
} from '../preferences.types';

/**
 * Critères consommés par le module de scoring.
 *
 * Les champs optionnels (budgetMax, studyFields, userGpa, semesterPref,
 * wantsDoubleDiploma, erasmusPref, minSpots, strictMode) relèvent bien du
 * score : l'optionalité ne dit rien de la catégorie. Ne pas les déplacer
 * vers PersonalNotesDto.
 */
export class ScoringPreferencesDto {
  /** Euros, comparé à University.extraChargeEur. Absent = pas de limite. */
  @IsOptional()
  @IsInt({ message: 'budgetMax doit être un entier (en euros)' })
  @Min(0, { message: 'budgetMax ne peut pas être négatif' })
  budgetMax?: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'countries doit contenir au moins un pays' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  countries!: string[];

  @IsArray()
  @ArrayNotEmpty({ message: 'languages doit contenir au moins une langue' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  languages!: string[];

  /**
   * Comparé à University.specializations : le critère vaut la part des
   * spécialisations choisies que l'université propose. Absent ou vide =
   * pas de préférence.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique({ message: 'studyFields ne doit pas contenir de doublons' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  studyFields?: string[];

  /** GPA sur 4, comparé à University.gpaMin. */
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'userGpa doit être un nombre (2 décimales max)' },
  )
  @Min(0, { message: 'userGpa ne peut pas être négatif' })
  @Max(4, { message: 'userGpa est sur 4' })
  userGpa?: number;

  /** Comparé à University.semester ; voir SEMESTER_PREFS. */
  @IsOptional()
  @IsIn(SEMESTER_PREFS, {
    message: `semesterPref doit valoir ${SEMESTER_PREFS.join(' | ')}`,
  })
  semesterPref?: SemesterPref;

  /**
   * Comparé à University.doubleDiploma : true = le critère compte (1 si
   * l'université délivre un double diplôme, 0 sinon). Absent = false.
   */
  @IsOptional()
  @IsBoolean({ message: 'wantsDoubleDiploma doit être un booléen' })
  wantsDoubleDiploma?: boolean;

  /** Comparé à University.erasmus ; voir ERASMUS_PREFS. */
  @IsOptional()
  @IsIn(ERASMUS_PREFS, {
    message: `erasmusPref doit valoir ${ERASMUS_PREFS.join(' | ')}`,
  })
  erasmusPref?: ErasmusPref;

  /** Places minimum, comparé à University.spots (ex. 3 pour partir à trois). */
  @IsOptional()
  @IsInt({ message: 'minSpots doit être un entier' })
  @Min(1, { message: 'minSpots doit valoir au moins 1' })
  @Max(1000, { message: 'minSpots est trop grand' })
  minSpots?: number;

  /**
   * Mode strict : ne classe que les universités qui respectent entièrement
   * chaque critère renseigné (voir passesStrict). Absent = false.
   */
  @IsOptional()
  @IsBoolean({ message: 'strictMode doit être un booléen' })
  strictMode?: boolean;
}
