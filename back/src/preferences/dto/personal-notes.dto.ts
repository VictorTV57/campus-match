import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Notes personnelles : stockées et restituées telles quelles, jamais utilisées
 * dans le calcul du score. Aucune donnée université correspondante n'existe
 * dans l'API Epitech, donc rien à comparer.
 */
export class PersonalNotesDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  foodPref?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  socialPref?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  climatePref?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  housingType?: string;
}
