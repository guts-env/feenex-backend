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
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';

@Injectable()
export class SubscriptionLimitGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionLimitGuard.name);

  constructor(
    private readonly accountPlansService: AccountPlansService,
    private readonly organizationsService: OrganizationsService,
    private readonly subscriptionsService: SubscriptionsService,
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
      if (accountPlan.subscription_limit === -1) {
        return true;
      }

      const currentSubscriptionCount =
        await this.subscriptionsService.getSubscriptionCount(organizationId);

      if (currentSubscriptionCount >= accountPlan.subscription_limit) {
        this.logger.warn(
          `Subscription limit exceeded for organization ${organizationId}. ` +
            `Current: ${currentSubscriptionCount}, Limit: ${accountPlan.subscription_limit}`,
        );

        throw new ForbiddenException({
          message: `Subscription limit of ${accountPlan.subscription_limit} reached for your ${accountPlan.plan_type} plan`,
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Error checking subscription limit for organization ${organizationId}:`,
        error,
      );

      throw new ForbiddenException({
        message: 'Unable to verify subscription limits',
      });
    }
  }
}
