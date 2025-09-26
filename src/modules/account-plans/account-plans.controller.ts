import { Controller, Get, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { type Response } from 'express';
import { AccountPlansService } from '@/modules/account-plans/account-plans.service';
import { OrganizationsService } from '@/modules/organizations/organizations.service';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import {
  AdminsOnly,
  BusinessAdminOnly,
} from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';
import { ModuleRoutes } from '@/common/constants/routes';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@Controller(ModuleRoutes.AccountPlans.Main)
@RoleProtected()
export class AccountPlansController {
  constructor(
    private readonly accountPlansService: AccountPlansService,
    private readonly organizationsService: OrganizationsService,
    private readonly expensesService: ExpensesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // @Get()
  // @BusinessAdminOnly()
  // async getAllPlans() {
  //   return this.accountPlansService.findAll();
  // }

  @Get(ModuleRoutes.AccountPlans.Paths.Organization)
  @AdminsOnly()
  async getOrganizationLimits(
    @Req() req: IAuthenticatedRequest,
    @Res() res: Response,
  ) {
    const organization =
      await this.organizationsService.getOrganizationWithPlan(
        req.user.organization.id,
      );

    if (!organization?.account_plan_id) {
      throw new Error('Organization has no account plan');
    }

    const accountPlan = await this.accountPlansService.findById(
      organization.account_plan_id,
    );

    const [
      currentMemberCount,
      currentSubscriptionCount,
      currentManualExpenseCount,
      currentAutoExpenseCount,
    ] = await Promise.all([
      this.organizationsService.getMemberCount(req.user.organization.id),
      this.subscriptionsService.getSubscriptionCount(req.user.organization.id),
      this.expensesService.getManualExpensesCount(req.user.organization.id),
      this.expensesService.getAutoExpensesCount(req.user.organization.id),
    ]);

    // Personal organizations are always limited to 1 member regardless of plan
    const effectiveMemberLimit =
      organization.type === 'personal' ? 1 : accountPlan.team_member_limit;

    const result = {
      plan: {
        id: accountPlan.id,
        plan_type: accountPlan.plan_type,
        limits: {
          team_member_limit: effectiveMemberLimit,
          subscription_limit: accountPlan.subscription_limit,
          manual_receipt_limit: accountPlan.manual_receipt_limit,
          auto_receipt_limit: accountPlan.auto_receipt_limit,
        },
      },
      usage: {
        members: {
          current: currentMemberCount,
          limit: effectiveMemberLimit,
          remaining:
            effectiveMemberLimit === -1
              ? -1
              : Math.max(0, effectiveMemberLimit - currentMemberCount),
        },
        subscriptions: {
          current: currentSubscriptionCount,
          limit: accountPlan.subscription_limit,
          remaining:
            accountPlan.subscription_limit === -1
              ? -1
              : Math.max(
                  0,
                  accountPlan.subscription_limit - currentSubscriptionCount,
                ),
        },
        manual_expenses: {
          current: currentManualExpenseCount,
          limit: accountPlan.manual_receipt_limit,
          remaining:
            accountPlan.manual_receipt_limit === -1
              ? -1
              : Math.max(
                  0,
                  accountPlan.manual_receipt_limit - currentManualExpenseCount,
                ),
        },
        auto_expenses: {
          current: currentAutoExpenseCount,
          limit: accountPlan.auto_receipt_limit,
          remaining:
            accountPlan.auto_receipt_limit === -1
              ? -1
              : Math.max(
                  0,
                  accountPlan.auto_receipt_limit - currentAutoExpenseCount,
                ),
        },
      },
    };

    return res.status(HttpStatus.OK).json(result);
  }

  @Get(':id')
  @BusinessAdminOnly()
  async getPlanById(@Param('id') id: string) {
    return this.accountPlansService.findById(id);
  }
}
