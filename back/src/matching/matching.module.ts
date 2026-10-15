import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { SwipesModule } from '../swipes/swipes.module';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  // AuthModule réexporte JwtModule, dont JwtAuthGuard a besoin.
  imports: [AuthModule, PreferencesModule, SwipesModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
