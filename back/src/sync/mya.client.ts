import { Injectable, Logger } from '@nestjs/common';
import { MYA_BASE_URL } from './mya.types';

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
const DETAIL_CONCURRENCY = 6;

/** L'API est injoignable ou répond en erreur, même après les retries. */
export class MyaFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MyaFetchError';
  }
}

/**
 * Accès HTTP brut à l'API mya. Ne valide pas la forme des réponses
 * (c'est le rôle de mya.validation.ts) : renvoie du JSON non typé.
 */
@Injectable()
export class MyaClient {
  private readonly logger = new Logger(MyaClient.name);

  fetchList(): Promise<unknown> {
    return this.getJson('/api/universities');
  }

  /** Fiches détaillées, au plus DETAIL_CONCURRENCY requêtes simultanées. */
  fetchDetails(
    ids: number[],
  ): Promise<{ expectedId: number; data: unknown }[]> {
    return mapWithConcurrency(ids, DETAIL_CONCURRENCY, async (id) => ({
      expectedId: id,
      data: await this.getJson(`/api/universities/${id}`),
    }));
  }

  private async getJson(path: string): Promise<unknown> {
    const url = `${MYA_BASE_URL}${path}`;
    let lastError = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        this.logger.warn(
          `Retry ${attempt}/${MAX_RETRIES} ${path} (${lastError})`,
        );
        await sleep(RETRY_DELAY_MS * attempt);
      }
      try {
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (response.ok) {
          return (await response.json()) as unknown;
        }
        lastError = `HTTP ${response.status}`;
        // Un 4xx (hors 429) ne se corrigera pas en réessayant.
        if (response.status < 500 && response.status !== 429) {
          break;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    throw new MyaFetchError(`GET ${url} a échoué : ${lastError}`);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
