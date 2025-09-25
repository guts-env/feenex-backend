import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IAuthenticatedRequest } from '@/modules/auth/types/auth';
import { AccountPlansService } from '@/modules/account-plans/account-plans.service';
import { OrganizationsService } from '@/modules/organizations/organizations.service';

@Injectable()
export class MemberLimitGuard implements CanActivate {
  private readonly logger = new Logger(MemberLimitGuard.name);

  constructor(
    private readonly accountPlansService: AccountPlansService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: IAuthenticatedRequest = context.switchToHttp().getRequest();
    const organizationId = request.user.organization.id;

    try {
      const organization =
        await this.organizationsService.getOrganizationWithPlan(organizationId);

      if (!organization?.account_plan_id) {
        this.logger.warn(`Organization ${organizationId} has no account plan`);

        throw new ForbiddenException({
          message: 'Organization account plan not found',
        });
      }

      const accountPlan = await this.accountPlansService.findById(
        organization.account_plan_id,
      );

      /* -1 means unlimited */
      if (accountPlan.team_member_limit === -1) {
        return true;
      }

      const currentMemberCount =
        await this.organizationsService.getMemberCount(organizationId);

      if (currentMemberCount >= accountPlan.team_member_limit) {
        this.logger.warn(
          `Member limit exceeded for organization ${organizationId}. ` +
            `Current: ${currentMemberCount}, Limit: ${accountPlan.team_member_limit}`,
        );

        throw new ForbiddenException({
          message: `Member limit of ${accountPlan.team_member_limit} reached for your ${accountPlan.plan_type} plan`,
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Error checking member limit for organization ${organizationId}:`,
        error,
      );

      throw new ForbiddenException({
        message: 'Unable to verify member limits',
      });
    }
  }
}
