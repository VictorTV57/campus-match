import { IsJWT } from 'class-validator';

export class RefreshDto {
  @IsJWT({ message: 'refreshToken doit être un JWT valide' })
  refreshToken!: string;
}
