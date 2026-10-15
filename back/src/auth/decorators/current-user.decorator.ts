import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, JwtPayload } from '../auth.types';

/**
 * Injecte le payload du token dans un handler protégé par JwtAuthGuard :
 *   me(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
