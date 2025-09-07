import { type IBaseRepositoryInterface } from '@/common/modules/base/types/base';
import {
  JsonValue,
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
    'created_at' | 'updated_at' | 'created_by' | 'updated_by'
  >;
  merchant_name: string;
  photos?: string[] | null;
  amount: string;
  currency: CurrencyCode;
  date: Date;
  description?: string | null;
  items?: IExpenseItem[] | null;
  other_details?: IExpenseOtherDetails[] | null;
  source: ExpenseSource;
  status: ExpenseStatus;
  verified_by?: Omit<
    IBaseRepositoryUser,
    'created_at' | 'updated_at' | 'created_by' | 'updated_by'
  > | null;
}

export interface IRepositoryExpenseWithOrg extends IBaseRepositoryExpense {
  organization_id: string;
}

export interface IExpenseQueryResult {
  id: string;
  amount: string;
  category_id: string;
  category_name: string;
  currency: CurrencyCode;
  source: ExpenseSource;
  status: ExpenseStatus;
  merchant_name: string;
  photos?: string[] | null;
  date: Date;
  description?: string | null;
  items?: JsonValue | null;
  other_details?: JsonValue | null;
  created_at: Date;
  updated_at: Date;
  verified_by: string;
  verified_by_email: string;
  created_by: string;
  created_by_email: string;
  updated_by: string;
  updated_by_email: string;
}
