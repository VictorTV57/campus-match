import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from './sync.service';

/**
 * Remplit la table University au premier démarrage du serveur.
 * Séparé de SyncService pour que le script `npm run sync` ne déclenche
 * pas un second run.
 */
@Injectable()
export class SyncOnBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncOnBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SyncService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((await this.prisma.university.count()) > 0) {
      return;
    }
    this.logger.log('Table University vide : sync mya initial');
    try {
      await this.sync.run();
    } catch (err) {
      // Le serveur démarre quand même ; relancer via POST /sync ou npm run sync.
      this.logger.error(
        'Sync initial échoué',
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
