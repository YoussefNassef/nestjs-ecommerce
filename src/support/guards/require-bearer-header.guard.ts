import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class RequireBearerHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authorizationHeader = request.headers.authorization;

    if (
      typeof authorizationHeader !== 'string' ||
      !authorizationHeader.trim().toLowerCase().startsWith('bearer ')
    ) {
      throw new UnauthorizedException(
        'Authorization Bearer token is required for SSE stream',
      );
    }

    return true;
  }
}
