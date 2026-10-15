import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { ExportModule } from './export/export.module';
import { MatchingModule } from './matching/matching.module';
import { PreferencesModule } from './preferences/preferences.module';
import { PrismaModule } from './prisma/prisma.module';
import { SwipesModule } from './swipes/swipes.module';
import { SyncModule } from './sync/sync.module';
import { UniversitiesModule } from './universities/universities.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    AuthModule,
    PreferencesModule,
    SyncModule,
    UniversitiesModule,
    SwipesModule,
    MatchingModule,
    ExportModule,
  ],
})
export class AppModule {}
