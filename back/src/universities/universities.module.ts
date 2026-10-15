import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UniversitiesController } from './universities.controller';
import { UniversitiesService } from './universities.service';

@Module({
  // AuthModule réexporte JwtModule, dont JwtAuthGuard a besoin.
  imports: [AuthModule],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
})
export class UniversitiesModule {}
