import { Expose, Transform } from 'class-transformer';
import { type IBaseRepositorySubscription } from '@/modules/subscriptions/types/subscriptions';

export default class GetActiveBillingResDto {
  @Expose()
  title!: string;

  @Expose()
  amount!: number;

  @Expose()
  @Transform(
    ({ obj }: { obj: IBaseRepositorySubscription }) => obj.billing_date,
  )
  billingDate!: Date;
}
