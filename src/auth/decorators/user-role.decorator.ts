import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../roles/entities/role.entity';
import type { AuthenticatedRequest } from '../guards/auth-token.guard';

export const UserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Role | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as any;
    return user?.role;
  },
);
