import { ExpenseStatusEnum } from '@/common/constants/enums';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ExpenseItemDto,
  ExpenseOtherDetailDto,
} from '@/modules/expenses/dto/create-expense.dto';
import { type IRepositoryExpense } from '@/modules/expenses/types/expenses';

export default class GetExpenseResDto {
  @Expose()
  id: string;

  @Expose()
  @Transform(({ obj }: { obj: IRepositoryExpense }) => obj.user_id)
  userId: string;

  @Expose()
  @Transform(({ obj }: { obj: IRepositoryExpense }) => obj.organization_id)
  organizationId: string;

  @Expose()
  @Transform(({ obj }: { obj: IRepositoryExpense }) => obj.category_id)
  categoryId: string;

  @Expose()
  amount: number;

  @Expose()
  status: ExpenseStatusEnum;

  @Expose()
  @Transform(({ obj }: { obj: IRepositoryExpense }) => obj.merchant_name)
  merchantName: string;

  @Expose()
  date: string;

  @Expose()
  @Transform(({ obj }: { obj: IRepositoryExpense }) => obj.created_at)
  createdAt: Date;

  @Expose()
  @Transform(({ obj }: { obj: IRepositoryExpense }) => obj.updated_at)
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }: { obj: IRepositoryExpense }) => obj.verified_by)
  verifiedBy?: string;

  @Expose()
  description?: string;

  @Expose()
  photos?: string[];

  @Expose()
  @Type(() => ExpenseItemDto)
  items?: ExpenseItemDto[];

  @Expose()
  @Transform(({ obj }: { obj: IRepositoryExpense }) => obj.other_details)
  @Type(() => ExpenseOtherDetailDto)
  otherDetails?: ExpenseOtherDetailDto[];
}
