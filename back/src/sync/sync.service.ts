import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MyaClient } from './mya.client';
import { toUniversityData } from './mya.mapper';
import { assertMyaList, assertMyaUniversities } from './mya.validation';

export interface SyncResult {
  created: number;
  updated: number;
  deactivated: number;
  durationMs: number;
}

// SQLite + ~150 upserts : large marge sur le timeout par défaut (5 s).
const TRANSACTION_TIMEOUT_MS = 60_000;

/**
 * Copie l'API mya dans la table University. Tout est récupéré et validé
 * AVANT d'ouvrir la transaction : une réponse mal formée ou une panne
 * réseau lève une erreur sans rien écrire.
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mya: MyaClient,
  ) {}

  async run(): Promise<SyncResult> {
    if (this.running) {
      throw new ConflictException('Une synchronisation est déjà en cours');
    }
    this.running = true;
    try {
      return await this.doRun();
    } finally {
      this.running = false;
    }
  }

  private async doRun(): Promise<SyncResult> {
    const start = Date.now();

    const list = assertMyaList(await this.mya.fetchList());
    const details = assertMyaUniversities(
      await this.mya.fetchDetails(list.map((u) => u.id)),
    );
    const rows = details.map(toUniversityData);
    const myaIds = rows.map((row) => row.myaId);

    const { created, updated, deactivated } = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.university.findMany({
          where: { myaId: { in: myaIds } },
          select: { myaId: true },
        });
        const existingIds = new Set(existing.map((u) => u.myaId));

        for (const row of rows) {
          await tx.university.upsert({
            where: { myaId: row.myaId },
            create: row,
            update: row,
          });
        }

        // Pas de delete : les swipes sur une université retirée sont gardés.
        const { count } = await tx.university.updateMany({
          where: { myaId: { notIn: myaIds }, active: true },
          data: { active: false },
        });

        return {
          created: rows.length - existingIds.size,
          updated: existingIds.size,
          deactivated: count,
        };
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );

    const result = {
      created,
      updated,
      deactivated,
      durationMs: Date.now() - start,
    };
    this.logger.log(`Sync mya terminé : ${JSON.stringify(result)}`);
    return result;
  }
}
