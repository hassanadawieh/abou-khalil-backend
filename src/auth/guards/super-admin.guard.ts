import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth-token.guard';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as
      | { role?: { name?: string }; role_id?: number }
      | undefined;

    const roleName = (user?.role?.name ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');

    if (roleName === 'superadmin' || user?.role_id === 2) {
      return true;
    }

    throw new ForbiddenException(
      'Only superAdmin users can perform this action',
    );
  }
}
