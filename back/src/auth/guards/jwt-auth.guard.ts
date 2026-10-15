import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedRequest, JwtPayload } from '../auth.types';

/**
 * Protège une route en exigeant un access token valide :
 *   @UseGuards(JwtAuthGuard)
 *
 * Le payload décodé est attaché à `request.user` et récupérable
 * via le décorateur `@CurrentUser()`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (token === null) {
      throw new UnauthorizedException('Access token manquant');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        // Secret de l'access token uniquement : un refresh token présenté
        // ici ne doit pas donner accès aux routes protégées.
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      (request as AuthenticatedRequest).user = {
        sub: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException('Access token invalide ou expiré');
    }

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (typeof header !== 'string') {
      return null;
    }
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || token === undefined || token.length === 0) {
      return null;
    }
    return token;
  }
}
