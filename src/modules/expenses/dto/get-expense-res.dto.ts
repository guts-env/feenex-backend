import { Expose, Transform, Type } from 'class-transformer';
import BaseCategoryResDto from '@/modules/categories/dto/base-category-res.dto';
import UserResDto from '@/modules/users/dto/base-user-res.dto';
import { type IBaseRepositoryExpense } from '@/modules/expenses/types/expenses';
import { type ProcessingStatus, type ExpenseStatus } from '@/database/types/db';

class ExpenseItemResDto {
  @Expose()
  name!: string;

  @Expose()
  quantity!: number;

  @Expose()
  price!: number;
}

export default class GetExpenseResDto {
  @Expose()
  id!: string;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.or_number)
  orNumber?: string;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.category)
  @Type(() => BaseCategoryResDto)
  category!: BaseCategoryResDto;

  @Expose()
  amount!: number;

  @Expose()
  status!: ExpenseStatus;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.is_vat)
  isVat?: boolean;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.vat)
  vat?: number;

  @Expose()
  @Transform(
    ({ obj }: { obj: IBaseRepositoryExpense }) => obj.processing_status,
  )
  processingStatus!: ProcessingStatus;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.merchant_name)
  merchantName!: string;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.invoice_date)
  invoiceDate!: string;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.payment_date)
  paymentDate!: string;

  @Expose()
  description?: string;

  @Expose()
  photos?: string[];

  @Expose()
  @Type(() => ExpenseItemResDto)
  items?: ExpenseItemResDto[];

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.created_by)
  @Type(() => UserResDto)
  createdBy!: UserResDto;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.updated_by)
  @Type(() => UserResDto)
  updatedBy!: UserResDto;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.verified_by)
  @Type(() => UserResDto)
  verifiedBy?: UserResDto;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.created_at)
  createdAt!: Date;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.updated_at)
  updatedAt!: Date;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositoryExpense }) => obj.verified_at)
  verifiedAt?: Date;
}
