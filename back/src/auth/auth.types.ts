import type { Request } from 'express';

/** Payload signé dans les deux tokens (access et refresh). */
export interface JwtPayload {
  /** Id de l'utilisateur (claim standard "subject"). */
  sub: string;
  email: string;
}

/** Claims ajoutés par jsonwebtoken à la signature. */
export type JwtPayloadWithExp = JwtPayload & { iat: number; exp: number };

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/** Utilisateur exposé par l'API : jamais de passwordHash. */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  /** Compte invité (connexion anonyme) : données temporaires. */
  isGuest: boolean;
}

/** Requête enrichie par le JwtAuthGuard. */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
