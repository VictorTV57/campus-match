import {
  BadGatewayException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MyaFetchError } from './mya.client';
import { MyaShapeError } from './mya.validation';
import { SyncService, type SyncResult } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  /** Relance la copie de l'API mya dans SQLite. */
  @Post()
  @HttpCode(HttpStatus.OK)
  async run(): Promise<SyncResult> {
    try {
      return await this.sync.run();
    } catch (err) {
      // Problème côté API mya, pas côté client : 502 plutôt que 500.
      if (err instanceof MyaFetchError || err instanceof MyaShapeError) {
        throw new BadGatewayException(err.message);
      }
      throw err;
    }
  }
}
