import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpsertPreferencesDto } from './dto/upsert-preferences.dto';
import { PreferencesService } from './preferences.service';
import type { PreferencesResponse } from './preferences.types';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  /** Préférences de l'utilisateur connecté. 404 s'il n'en a pas encore. */
  @Get()
  find(@CurrentUser() user: JwtPayload): Promise<PreferencesResponse> {
    return this.preferences.findByUser(user.sub);
  }

  /** Crée ou remplace les préférences de l'utilisateur connecté. */
  @Put()
  upsert(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertPreferencesDto,
  ): Promise<PreferencesResponse> {
    return this.preferences.upsert(user.sub, dto);
  }
}
