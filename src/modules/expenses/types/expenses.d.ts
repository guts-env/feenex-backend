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
  organization_id: string;
  user_id: string;
  category_id: string;
  merchant_name: string;
  photos?: string[];
  amount: number;
  currency: CurrencyCodeEnum;
  date: Date;
  description?: string;
  items?: IExpenseItem[];
  other_details?: IExpenseOtherDetails[];
  ocr_result_id?: string;
  llm_result_id?: string;
  source: ExpenseSourceEnum;
  status: ExpenseStatusEnum;
  verified_by?: string;
  import_id?: string;
}
