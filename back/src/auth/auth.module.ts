import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  // Pas de secret global : chaque signature/vérification passe le sien,
  // pour que l'access token et le refresh token restent cloisonnés.
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // JwtModule est réexporté pour que JwtAuthGuard soit utilisable
  // dans les modules qui importent AuthModule.
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
