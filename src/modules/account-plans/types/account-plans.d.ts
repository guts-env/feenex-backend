import { type PlanType } from '@/database/types/db';
import { type IBaseRepositoryInterface } from '@/common/modules/base/types/base';

export interface IRepositoryAccountPlan extends IBaseRepositoryInterface {
  plan_type: PlanType;
  auto_receipt_limit: number;
  team_member_limit: number;
  manual_receipt_limit: number;
  subscription_limit: number;
}
