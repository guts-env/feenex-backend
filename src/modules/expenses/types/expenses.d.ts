import { type IBaseRepositoryInterface } from '@/common/modules/base/types/base';
import {
  type CurrencyCodeEnum,
  type ExpenseSourceEnum,
  type ExpenseStatusEnum,
} from '@/common/constants/enums';

export interface IExpenseItem {
  name: string;
  quantity: number;
  price: number;
}

export interface IExpenseOtherDetails {
  key: string;
  value: string;
}

export interface IRepositoryExpense extends IBaseRepositoryInterface {
  user_id: string;
  organization_id: string;
  category_id: string;
  verified_by?: string;
  amount: number;
  merchant_name: string;
  source: ExpenseSourceEnum;
  status: ExpenseStatusEnum;
  currency: CurrencyCodeEnum;
  date: string;
  photos?: string[];
  description?: string;
  items?: IExpenseItem[];
  other_details?: IExpenseOtherDetails[];
}
