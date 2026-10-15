import { Type } from 'class-transformer';
import {
  IsDefined,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { PersonalNotesDto } from './personal-notes.dto';
import { ScoringPreferencesDto } from './scoring-preferences.dto';

/**
 * Corps de PUT /preferences.
 *
 * Les deux catégories sont séparées structurellement : un futur champ devra
 * être rangé dans l'un ou l'autre sous-objet, ce qui rend la distinction
 * score / notes personnelles vérifiable sans contexte externe.
 *
 * Sémantique de remplacement complet : un champ optionnel absent est remis
 * à null, et omettre "notes" efface les quatre notes.
 */
export class UpsertPreferencesDto {
  @IsDefined({ message: 'scoring est requis' })
  @IsObject()
  @ValidateNested()
  @Type(() => ScoringPreferencesDto)
  scoring!: ScoringPreferencesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonalNotesDto)
  notes?: PersonalNotesDto;
}
