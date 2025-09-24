import { Expose, Transform } from 'class-transformer';
import {
  type SubscriptionStatus,
  type RecurringFrequency,
  type CurrencyCode,
} from '@/database/types/db';
import { type IBaseRepositorySubscription } from '@/modules/subscriptions/types/subscriptions';

export default class GetDueBillingResDto {
  @Expose()
  id!: string;

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
  currency!: CurrencyCode;

  @Expose()
  frequency!: RecurringFrequency;

  @Expose()
  @Transform(
    ({ obj }: { obj: IBaseRepositorySubscription }) => obj.billing_date,
  )
  billingDate!: Date;

  @Expose()
  status!: SubscriptionStatus;
}
