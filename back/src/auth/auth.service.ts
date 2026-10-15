import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload, PublicUser, Tokens } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Durée de vie d'un compte invité : au-delà, il est supprimé avec ses
 * données (préférences, swipes) et son refresh token cesse de marcher.
 */
export const GUEST_TTL_MS = 24 * 60 * 60 * 1000;
const GUEST_REFRESH_TTL = '24h';
/** Domaine réservé (RFC 2606) : jamais une vraie adresse. */
const GUEST_EMAIL_DOMAIN = 'guest.campusmatch.invalid';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: PublicUser } & Tokens> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing !== null) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    const tokens = await this.signTokens(user.id, user.email);
    return { user: this.toPublicUser(user), ...tokens };
  }

  /** Au démarrage : on efface les invités expirés pendant l'arrêt. */
  async onApplicationBootstrap(): Promise<void> {
    await this.purgeExpiredGuests();
  }

  /**
   * Connexion anonyme : compte invité sans identifiants utilisables (email
   * aléatoire, mot de passe aléatoire jamais communiqué), donc impossible à
   * rouvrir avec /auth/login. Supprimé à la déconnexion ou après 24 h.
   */
  async createGuest(): Promise<{ user: PublicUser } & Tokens> {
    await this.purgeExpiredGuests();
    const user = await this.prisma.user.create({
      data: {
        email: `guest-${randomUUID()}@${GUEST_EMAIL_DOMAIN}`,
        passwordHash: await argon2.hash(randomBytes(32).toString('hex')),
        firstName: 'Invité',
        lastName: '',
        isGuest: true,
      },
    });
    const tokens = await this.signTokens(
      user.id,
      user.email,
      GUEST_REFRESH_TTL,
    );
    return { user: this.toPublicUser(user), ...tokens };
  }

  /** Déconnexion d'un invité : son compte et ses données sont supprimés. */
  async deleteGuest(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user === null) return; // déjà supprimé (expiré) : rien à faire
    if (!user.isGuest) {
      throw new ForbiddenException(
        'Seul un compte invité peut être supprimé de cette façon',
      );
    }
    // onDelete: Cascade → préférences et swipes partent avec le compte.
    await this.prisma.user.delete({ where: { id: userId } });
  }

  /** Supprime les comptes invités de plus de 24 h (et leurs données). */
  async purgeExpiredGuests(): Promise<number> {
    const { count } = await this.prisma.user.deleteMany({
      where: {
        isGuest: true,
        createdAt: { lt: new Date(Date.now() - GUEST_TTL_MS) },
      },
    });
    if (count > 0)
      this.logger.log(`${count} compte(s) invité(s) expiré(s) supprimé(s)`);
    return count;
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Message identique que l'email soit inconnu ou le mot de passe faux,
    // pour ne pas révéler quels emails sont enregistrés.
    if (user === null) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const tokens = await this.signTokens(user.id, user.email);
    return { user: this.toPublicUser(user), ...tokens };
  }

  /**
   * Échange un refresh token valide contre un nouvel access token.
   * Le refresh token fourni reste valable jusqu'à sa propre expiration.
   */
  async refresh(dto: RefreshDto): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // Le token peut être signé mais l'utilisateur avoir été supprimé depuis.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (user === null || isExpiredGuest(user)) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const accessToken = await this.signAccessToken(user.id, user.email);
    return { accessToken };
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user === null) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return this.toPublicUser(user);
  }

  private async signTokens(
    id: string,
    email: string,
    refreshTtl?: string,
  ): Promise<Tokens> {
    const payload: JwtPayload = { sub: id, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(id, email),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          refreshTtl === undefined
            ? this.ttl('JWT_REFRESH_TTL', '7d')
            : (refreshTtl as SignOptions['expiresIn']),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private signAccessToken(id: string, email: string): Promise<string> {
    const payload: JwtPayload = { sub: id, email };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.ttl('JWT_ACCESS_TTL', '15m'),
    });
  }

  /**
   * Les durées viennent de l'environnement, donc typées `string`, alors que
   * jsonwebtoken attend un littéral (`"15m"`, `"7d"`, ...). Le cast est isolé
   * ici, à l'unique frontière entre l'env et l'API typée.
   */
  private ttl(key: string, fallback: string): SignOptions['expiresIn'] {
    return this.config.get<string>(key, fallback) as SignOptions['expiresIn'];
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      isGuest: user.isGuest,
    };
  }
}

function isExpiredGuest(user: User): boolean {
  return user.isGuest && Date.now() - user.createdAt.getTime() > GUEST_TTL_MS;
}
