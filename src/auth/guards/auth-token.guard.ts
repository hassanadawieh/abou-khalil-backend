import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

export interface AuthenticatedRequest extends Request {
  user?: unknown;
  accessToken?: string;
}

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.authService.extractBearerToken(
      request.headers.authorization,
    );
    const tokenEntity = await this.authService.validateAccessToken(token);

    request.user = tokenEntity.user;
    request.accessToken = token;

    return true;
  }
}
