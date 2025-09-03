import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_METADATA_KEY } from '@/modules/auth/decorators/roles.decorator';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';
import {
  USER_INSUFFICIENT_ROLE,
  USER_MISSING_ROLE,
} from '@/common/constants/logger';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request: IAuthenticatedRequest = context.switchToHttp().getRequest();

    const userRole = request.user.role;

    if (!userRole) {
      this.logSecurityEvent(request, USER_MISSING_ROLE, { requiredRoles });
      throw new ForbiddenException({
        message: 'Invalid credentials',
      });
    }

    const hasRequiredRole = requiredRoles.some(
      (role) => userRole.name.toLowerCase() === role.toLowerCase(),
    );

    if (!hasRequiredRole) {
      this.logSecurityEvent(request, USER_INSUFFICIENT_ROLE, { requiredRoles });
      throw new ForbiddenException({
        message: 'Invalid credentials',
      });
    }

    return true;
  }

  private logSecurityEvent(
    request: IAuthenticatedRequest,
    event: string,
    additionalData?: Record<string, any>,
  ) {
    this.logger.error({
      log: event,
      route: request.url,
      userId: request.user?.sub || 'unknown',
      userEmail: request.user?.email || 'unknown',
      userRole: request.user?.role?.name || 'unknown',
      userOrg: request.user?.organization?.id || 'unknown',
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
  }
}
