import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'email doit être une adresse email valide' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'password doit contenir au moins 8 caractères' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;
}
