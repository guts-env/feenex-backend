import { Expose, Type } from 'class-transformer';
import GetSubscriptionResDto from '@/modules/subscriptions/dto/get-subscription-res.dto';

export default class GetSubscriptionsResDto {
  @Expose()
  count!: number;

  @Expose()
  @Type(() => GetSubscriptionResDto)
  data!: GetSubscriptionResDto[];
}
