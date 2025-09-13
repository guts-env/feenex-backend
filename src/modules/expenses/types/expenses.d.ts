import { type IBaseRepositoryInterface } from '@/common/modules/base/types/base';
import {
  type CurrencyCode,
  type ExpenseSource,
  type ExpenseStatus,
} from '@/database/types/db';
import { type IBaseRepositoryCategory } from '@/modules/categories/types/categories';
import { type IBaseRepositoryUser } from '@/modules/users/types/users';

export interface IExpenseItem {
  name: string;
  quantity: number;
  price: number;
}

export interface IExpenseOtherDetails {
  key: string;
  value: string;
}

export interface IBaseRepositoryExpense extends IBaseRepositoryInterface {
  category: Omit<
    IBaseRepositoryCategory,
    'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'email'
  >;
  merchant_name: string;
  photos?: string[] | null;
  amount: number;
  currency: CurrencyCode;
  date: Date;
  description?: string | null;
  items?: IExpenseItem[] | null;
  other_details?: IExpenseOtherDetails[] | null;
  source: ExpenseSource;
  status: ExpenseStatus;
  verified_by?: Omit<
    IBaseRepositoryUser,
    'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'email'
  > | null;
  verified_at?: Date | null;
}

export interface IRepositoryExpenseWithOrg extends IBaseRepositoryExpense {
  organization_id: string;
}
