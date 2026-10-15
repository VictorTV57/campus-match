import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthService, GUEST_TTL_MS } from './auth.service';

const SECRETS: Record<string, string> = {
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
};

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'guest-x@guest.campusmatch.invalid',
    passwordHash: 'hash',
    firstName: 'Invité',
    lastName: '',
    createdAt: new Date(),
    isGuest: true,
    ...overrides,
  };
}

function setup(found: User | null = null) {
  const prisma = {
    user: {
      create: jest.fn(({ data }: { data: Partial<User> }) =>
        Promise.resolve(user(data)),
      ),
      findUnique: jest.fn().mockResolvedValue(found),
      delete: jest.fn().mockResolvedValue(found),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  };
  const config = {
    get: (_key: string, fallback: string) => fallback,
    getOrThrow: (key: string) => SECRETS[key],
  } as unknown as ConfigService;
  const jwt = new JwtService({});
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt,
    config,
  );
  return { service, prisma, jwt };
}

describe('AuthService — comptes invités', () => {
  it('createGuest : compte marqué invité, tokens, purge des expirés', async () => {
    const { service, prisma, jwt } = setup();

    const result = await service.createGuest();

    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: { isGuest: true, createdAt: { lt: expect.any(Date) as Date } },
    });
    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.isGuest).toBe(true);
    expect(data.email).toMatch(/^guest-.+@guest\.campusmatch\.invalid$/);
    expect(result.user.isGuest).toBe(true);

    // Refresh token invité : 24 h, pas 7 jours.
    const { iat, exp } = jwt.decode<{ iat: number; exp: number }>(
      result.refreshToken,
    );
    expect(exp - iat).toBe(24 * 60 * 60);
  });

  it('purge : seuil à 24 h', async () => {
    const { service, prisma } = setup();
    const before = Date.now();
    await service.purgeExpiredGuests();
    const threshold = (
      prisma.user.deleteMany.mock.calls[0] as [
        { where: { createdAt: { lt: Date } } },
      ]
    )[0].where.createdAt.lt.getTime();
    expect(before - threshold).toBeGreaterThanOrEqual(GUEST_TTL_MS);
    expect(before - threshold).toBeLessThan(GUEST_TTL_MS + 1000);
  });

  it('deleteGuest : supprime un invité', async () => {
    const { service, prisma } = setup(user());
    await service.deleteGuest('u1');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('deleteGuest : refuse de supprimer un vrai compte', async () => {
    const { service, prisma } = setup(user({ isGuest: false }));
    await expect(service.deleteGuest('u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('deleteGuest : déjà supprimé (expiré) → rien à faire', async () => {
    const { service, prisma } = setup(null);
    await expect(service.deleteGuest('u1')).resolves.toBeUndefined();
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('refresh : refusé pour un invité de plus de 24 h', async () => {
    const expired = user({
      createdAt: new Date(Date.now() - GUEST_TTL_MS - 60_000),
    });
    const { service, jwt } = setup(expired);
    const refreshToken = await jwt.signAsync(
      { sub: 'u1', email: expired.email },
      { secret: SECRETS.JWT_REFRESH_SECRET },
    );
    await expect(service.refresh({ refreshToken })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh : accepté pour un invité récent', async () => {
    const { service, jwt } = setup(user());
    const refreshToken = await jwt.signAsync(
      { sub: 'u1', email: 'guest' },
      { secret: SECRETS.JWT_REFRESH_SECRET },
    );
    await expect(service.refresh({ refreshToken })).resolves.toHaveProperty(
      'accessToken',
    );
  });
});
