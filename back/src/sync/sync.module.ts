import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MyaClient } from './mya.client';
import { SyncOnBootstrapService } from './sync-on-bootstrap.service';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  // AuthModule réexporte JwtModule, dont JwtAuthGuard a besoin.
  imports: [AuthModule],
  controllers: [SyncController],
  providers: [MyaClient, SyncService, SyncOnBootstrapService],
  exports: [SyncService],
})
export class SyncModule {}
