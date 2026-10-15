import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SwipeDto } from './dto/swipe.dto';
import { SwipesService } from './swipes.service';
import type { SwipeResponse } from './swipes.types';

@Controller('swipes')
@UseGuards(JwtAuthGuard)
export class SwipesController {
  constructor(private readonly swipes: SwipesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<SwipeResponse[]> {
    return this.swipes.list(user.sub);
  }

  /** Like / pass / super like ; remplace un swipe existant. */
  @Put(':universityId')
  upsert(
    @CurrentUser() user: JwtPayload,
    @Param('universityId', ParseUUIDPipe) universityId: string,
    @Body() dto: SwipeDto,
  ): Promise<SwipeResponse> {
    return this.swipes.upsert(user.sub, universityId, dto.action);
  }

  /** Annule un swipe : l'université revient dans le paquet. */
  @Delete(':universityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('universityId', ParseUUIDPipe) universityId: string,
  ): Promise<void> {
    return this.swipes.remove(user.sub, universityId);
  }

  @Delete()
  clear(@CurrentUser() user: JwtPayload): Promise<{ deleted: number }> {
    return this.swipes.clear(user.sub);
  }
}
