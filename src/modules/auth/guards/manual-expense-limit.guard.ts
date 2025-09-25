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
import { ExpensesService } from '@/modules/expenses/expenses.service';

@Injectable()
export class ManualExpenseLimitGuard implements CanActivate {
  private readonly logger = new Logger(ManualExpenseLimitGuard.name);

  constructor(
    private readonly accountPlansService: AccountPlansService,
    private readonly organizationsService: OrganizationsService,
    private readonly expensesService: ExpensesService,
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
      if (accountPlan.manual_receipt_limit === -1) {
        return true;
      }

      const currentManualExpenseCount =
        await this.expensesService.getManualExpensesCount(organizationId);

      if (currentManualExpenseCount >= accountPlan.manual_receipt_limit) {
        this.logger.warn(
          `Manual expense limit exceeded for organization ${organizationId}. ` +
            `Current: ${currentManualExpenseCount}, Limit: ${accountPlan.manual_receipt_limit}`,
        );

        throw new ForbiddenException({
          message: `Manual expense limit of ${accountPlan.manual_receipt_limit} reached for your ${accountPlan.plan_type} plan`,
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Error checking manual expense limit for organization ${organizationId}:`,
        error,
      );

      throw new ForbiddenException({
        message: 'Unable to verify manual expense limits',
      });
    }
  }
}
