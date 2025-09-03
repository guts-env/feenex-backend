import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  IExtractedOrgHeader,
  IAuthenticatedRequest,
} from '@/modules/auth/types/auth';
import {
  USER_MISSING_HEADER_ORG,
  USER_MISSING_ORG,
  USER_ORG_MISMATCH,
} from '@/common/constants/logger';

@Injectable()
export class HasOrganizationGuard implements CanActivate {
  private readonly logger = new Logger(HasOrganizationGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request: IAuthenticatedRequest = context.switchToHttp().getRequest();
    const extractedOrg = this.extractOrganizationId(request);

    if (!extractedOrg?.jwtOrg) {
      this.logSecurityEvent(request, USER_MISSING_ORG);
      throw new ForbiddenException({
        message: 'Invalid credentials',
      });
    }

    if (!extractedOrg?.headerOrg) {
      this.logSecurityEvent(request, USER_MISSING_HEADER_ORG);
      throw new ForbiddenException({
        message: 'Invalid credentials',
      });
    }

    if (extractedOrg.jwtOrg !== extractedOrg.headerOrg) {
      this.logSecurityEvent(request, USER_ORG_MISMATCH);
      throw new ForbiddenException({
        message: 'Invalid credentials',
      });
    }

    return true;
  }

  private extractOrganizationId(
    request: IAuthenticatedRequest,
  ): IExtractedOrgHeader {
    const jwtOrg = request.user.organization.id;
    const headerOrg = request.get('x-organization-id');

    return {
      jwtOrg,
      headerOrg,
    };
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
