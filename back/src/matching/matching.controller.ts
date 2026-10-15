import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TopQueryDto } from './dto/top-query.dto';
import {
  DECK_DEFAULT_SIZE,
  MatchingService,
  type Deck,
  type RankedUniversity,
} from './matching.service';

const DECK_MAX_SIZE = 50;

@Controller('ranking')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  /** Les 8 vœux suggérés, avec le score et son détail par critère. */
  @Get('top8')
  top8(
    @CurrentUser() user: JwtPayload,
    @Query() query: TopQueryDto,
  ): Promise<RankedUniversity[]> {
    return this.matching.top(user.sub, { filters: query });
  }

  /** Prochaines cartes à swiper (limit entre 1 et 50, 10 par défaut). */
  @Get('deck')
  deck(
    @CurrentUser() user: JwtPayload,
    @Query('limit', new DefaultValuePipe(DECK_DEFAULT_SIZE), ParseIntPipe)
    limit: number,
  ): Promise<Deck> {
    return this.matching.deck(
      user.sub,
      Math.min(Math.max(limit, 1), DECK_MAX_SIZE),
    );
  }
}
