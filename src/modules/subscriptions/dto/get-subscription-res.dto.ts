import { Expose, Transform, Type } from 'class-transformer';
import BaseCategoryResDto from '@/modules/categories/dto/base-category-res.dto';
import UserResDto from '@/modules/users/dto/base-user-res.dto';
import { type IBaseRepositorySubscription } from '@/modules/subscriptions/types/subscriptions';
import {
  type SubscriptionStatus,
  type RecurringFrequency,
} from '@/database/types/db';

export default class GetSubscriptionResDto {
  @Expose()
  id!: string;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositorySubscription }) => obj.category)
  @Type(() => BaseCategoryResDto)
  category!: BaseCategoryResDto;

  @Expose()
  title!: string;

  @Expose()
  @Transform(
    ({ obj }: { obj: IBaseRepositorySubscription }) => obj.merchant_name,
  )
  merchantName!: string;

  @Expose()
  amount!: number;

  @Expose()
  currency!: string;

  @Expose()
  description?: string;

  @Expose()
  frequency!: RecurringFrequency;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositorySubscription }) => obj.start_date)
  startDate!: Date;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositorySubscription }) => obj.end_date)
  endDate?: Date | null;

  @Expose()
  @Transform(
    ({ obj }: { obj: IBaseRepositorySubscription }) => obj.billing_date,
  )
  billingDate!: Date;

  @Expose()
  status!: SubscriptionStatus;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositorySubscription }) => obj.is_vat)
  isVat?: boolean | null;

  @Expose()
  vat?: number | null;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositorySubscription }) => obj.created_by)
  @Type(() => UserResDto)
  createdBy!: UserResDto;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositorySubscription }) => obj.updated_by)
  @Type(() => UserResDto)
  updatedBy!: UserResDto;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositorySubscription }) => obj.created_at)
  createdAt!: Date;

  @Expose()
  @Transform(({ obj }: { obj: IBaseRepositorySubscription }) => obj.updated_at)
  updatedAt!: Date;
}
