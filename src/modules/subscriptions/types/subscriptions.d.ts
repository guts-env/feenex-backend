import { type IBaseRepositoryInterface } from '@/common/modules/base/types/base';
import {
  type CurrencyCode,
  type SubscriptionStatus,
  type RecurringFrequency,
} from '@/database/types/db';
import { type IBaseRepositoryCategory } from '@/modules/categories/types/categories';

export interface IBaseRepositorySubscription extends IBaseRepositoryInterface {
  category: Omit<
    IBaseRepositoryCategory,
    'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'email'
  >;
  merchant_name: string;
  amount: number;
  currency: CurrencyCode;
  description?: string | null;
  frequency: RecurringFrequency;
  start_date: Date;
  end_date?: Date | null;
  billing_date: Date;
  status: SubscriptionStatus;
  is_vat?: boolean | null;
  vat?: number | null;
  category_name: string;
}

export interface IRepositorySubscriptionWithOrg
  extends IBaseRepositorySubscription {
  organization_id: string;
}
