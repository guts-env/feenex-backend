import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_METADATA_KEY } from '@/modules/auth/decorators/permissions.decorator';
import {
  type IPermission,
  type IAuthenticatedRequest,
} from '@/modules/auth/types/auth';
import { PermissionsService } from '@/modules/permissions/permissions.service';
import { USER_INSUFFICIENT_PERMISSIONS } from '@/common/constants/logger';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<IPermission[]>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request: IAuthenticatedRequest = context.switchToHttp().getRequest();

    const hasPermissions = await this.permissionsService.hasPermissions(
      request.user.sub,
      request.user.organization.id,
      requiredPermissions,
    );

    if (!hasPermissions) {
      this.logSecurityEvent(request, USER_INSUFFICIENT_PERMISSIONS, {
        requiredPermissions,
      });
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
