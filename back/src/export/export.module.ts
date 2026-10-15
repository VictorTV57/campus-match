import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { SwipesModule } from '../swipes/swipes.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  // AuthModule réexporte JwtModule, dont JwtAuthGuard a besoin.
  imports: [AuthModule, PreferencesModule, SwipesModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
