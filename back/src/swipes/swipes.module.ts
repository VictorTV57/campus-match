import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SwipesController } from './swipes.controller';
import { SwipesService } from './swipes.service';

@Module({
  // AuthModule réexporte JwtModule, dont JwtAuthGuard a besoin.
  imports: [AuthModule],
  controllers: [SwipesController],
  providers: [SwipesService],
  exports: [SwipesService],
})
export class SwipesModule {}
