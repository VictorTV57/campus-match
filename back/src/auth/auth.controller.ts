import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { JwtPayload, PublicUser, Tokens } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<{ user: PublicUser } & Tokens> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    return this.auth.login(dto);
  }

  /** Connexion anonyme : compte invité temporaire (24 h max). */
  @Post('guest')
  guest(): Promise<{ user: PublicUser } & Tokens> {
    return this.auth.createGuest();
  }

  /** Déconnexion d'un invité : supprime son compte et ses données. */
  @Delete('guest')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  deleteGuest(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.auth.deleteGuest(user.sub);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto): Promise<{ accessToken: string }> {
    return this.auth.refresh(dto);
  }

  /** Exemple de route protégée. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload): Promise<PublicUser> {
    return this.auth.findById(user.sub);
  }
}
