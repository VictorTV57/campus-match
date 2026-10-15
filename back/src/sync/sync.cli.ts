// Lance un sync mya hors serveur : npm run sync
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { MyaClient } from './mya.client';
import { SyncService } from './sync.service';

// Module minimal : ni HTTP, ni auth, ni sync automatique au bootstrap.
@Module({
  imports: [ConfigModule.forRoot(), PrismaModule],
  providers: [MyaClient, SyncService],
})
class SyncCliModule {}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SyncCliModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const result = await app.get(SyncService).run();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err: unknown) => {
  new Logger('sync').error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
