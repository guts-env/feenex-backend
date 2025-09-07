import { Expose, Transform, Type } from 'class-transformer';
import {
  ExpenseItemDto,
  ExpenseOtherDetailDto,
} from '@/modules/expenses/dto/create-expense.dto';
import BaseCategoryResDto from '@/modules/categories/dto/base-category-res.dto';
import { type IBaseRepositoryExpense } from '@/modules/expenses/types/expenses';
import { type ExpenseStatus } from '@/database/types/db';
import UserResDto from '@/modules/users/dto/base-user-res.dto';

export default class GetExpenseResDto {
  @Expose()
  id!: string;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.category)
  @Type(() => BaseCategoryResDto)
  category!: BaseCategoryResDto;

  @Expose()
  amount!: number;

  @Expose()
  status!: ExpenseStatus;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.merchant_name)
  merchantName!: string;

  @Expose()
  date!: string;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.created_at)
  createdAt!: Date;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.updated_at)
  updatedAt!: Date;

  @Expose()
  description?: string;

  @Expose()
  photos?: string[];

  @Expose()
  @Type(() => ExpenseItemDto)
  items?: ExpenseItemDto[];

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.other_details)
  @Type(() => ExpenseOtherDetailDto)
  otherDetails?: ExpenseOtherDetailDto[];

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.verified_by)
  @Type(() => UserResDto)
  verifiedBy?: UserResDto;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.created_by)
  @Type(() => UserResDto)
  createdBy!: UserResDto;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.updated_by)
  @Type(() => UserResDto)
  updatedBy!: UserResDto;
}
