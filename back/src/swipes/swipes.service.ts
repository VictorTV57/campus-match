import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Swipe } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  isSwipeAction,
  type SwipeAction,
  type SwipeResponse,
} from './swipes.types';

@Injectable()
export class SwipesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<SwipeResponse[]> {
    const swipes = await this.prisma.swipe.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return swipes.map(toResponse);
  }

  /** Swipes de l'utilisateur indexés par universityId (pour le classement). */
  async actionsByUniversity(userId: string): Promise<Map<string, SwipeAction>> {
    const swipes = await this.list(userId);
    return new Map(swipes.map((s) => [s.universityId, s.action]));
  }

  /**
   * Crée ou remplace le swipe (un seul par utilisateur et université).
   * Seules les universités actives peuvent être swipées.
   */
  async upsert(
    userId: string,
    universityId: string,
    action: SwipeAction,
  ): Promise<SwipeResponse> {
    const university = await this.prisma.university.findFirst({
      where: { id: universityId, active: true },
      select: { id: true },
    });
    if (university === null) {
      throw new NotFoundException('Université introuvable ou inactive');
    }

    const swipe = await this.prisma.swipe.upsert({
      where: { userId_universityId: { userId, universityId } },
      create: { userId, universityId, action },
      update: { action, createdAt: new Date() },
    });
    return toResponse(swipe);
  }

  async remove(userId: string, universityId: string): Promise<void> {
    const { count } = await this.prisma.swipe.deleteMany({
      where: { userId, universityId },
    });
    if (count === 0) {
      throw new NotFoundException('Aucun swipe sur cette université');
    }
  }

  /** Remet tous les swipes de l'utilisateur à zéro. */
  async clear(userId: string): Promise<{ deleted: number }> {
    const { count } = await this.prisma.swipe.deleteMany({ where: { userId } });
    return { deleted: count };
  }
}

/** Colonne String libre en base : on revérifie la valeur à la lecture. */
function toResponse(swipe: Swipe): SwipeResponse {
  if (!isSwipeAction(swipe.action)) {
    throw new InternalServerErrorException(
      `Swipe ${swipe.id} : action inconnue en base (${swipe.action})`,
    );
  }
  return {
    universityId: swipe.universityId,
    action: swipe.action,
    createdAt: swipe.createdAt,
  };
}
