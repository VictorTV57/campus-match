import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email doit être une adresse email valide' })
  email!: string;

  // Pas de MinLength ici : la politique de mot de passe s'applique à
  // l'inscription, la connexion doit juste comparer ce qui est fourni.
  @IsString()
  @IsNotEmpty()
  password!: string;
}
