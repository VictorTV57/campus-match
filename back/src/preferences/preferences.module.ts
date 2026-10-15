import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

@Module({
  // AuthModule réexporte JwtModule, dont JwtAuthGuard a besoin pour être
  // instancié dans l'injecteur de ce module.
  imports: [AuthModule],
  controllers: [PreferencesController],
  providers: [PreferencesService],
  exports: [PreferencesService],
})
export class PreferencesModule {}
