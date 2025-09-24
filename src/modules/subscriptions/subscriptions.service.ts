import { Injectable } from '@nestjs/common';
import { startOfMonth, endOfMonth } from 'date-fns';
import { plainToInstance } from 'class-transformer';
import { SubscriptionsRepository } from '@/modules/subscriptions/subscriptions.repository';
import { CreateSubscriptionDto } from '@/modules/subscriptions/dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '@/modules/subscriptions/dto/update-subscription.dto';
import { GetSubscriptionsDto } from '@/modules/subscriptions/dto/get-subscriptions.dto';
import {
  GetSubscriptionStatsDto,
  GetSubscriptionStatsResDto,
} from '@/modules/subscriptions/dto/get-subscription-stats.dto';
import GetSubscriptionResDto from '@/modules/subscriptions/dto/get-subscription-res.dto';
import GetSubscriptionsResDto from '@/modules/subscriptions/dto/get-subscriptions-res.dto';
import GetDueBillingResDto from '@/modules/subscriptions/dto/get-due-billing-res.dto';
import GetActiveBillingResDto from '@/modules/subscriptions/dto/get-active-billing-res.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
  ) {}

  async create(orgId: string, userId: string, dto: CreateSubscriptionDto) {
    return this.subscriptionsRepository.create(orgId, userId, dto);
  }

  async getSubscriptions(
    orgId: string,
    query: GetSubscriptionsDto,
  ): Promise<GetSubscriptionsResDto> {
    const subscriptions = await this.subscriptionsRepository.getSubscriptions(
      orgId,
      query,
    );

    return plainToInstance(GetSubscriptionsResDto, subscriptions);
  }

  async findById(id: string, orgId: string): Promise<GetSubscriptionResDto> {
    const subscription = await this.subscriptionsRepository.findById(id, orgId);
    return plainToInstance(GetSubscriptionResDto, subscription);
  }

  async update(
    id: string,
    userId: string,
    orgId: string,
    dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsRepository.update(id, userId, orgId, dto);
  }

  async delete(id: string, orgId: string) {
    return this.subscriptionsRepository.delete(id, orgId);
  }

  async getActiveSubscriptionsBilling(
    orgId: string,
  ): Promise<GetActiveBillingResDto[]> {
    const activeSubscriptions =
      await this.subscriptionsRepository.getActiveSubscriptionsBilling(orgId);
    return activeSubscriptions.map((subscription) =>
      plainToInstance(GetActiveBillingResDto, subscription),
    );
  }

  async getSubscriptionsDueForBilling(
    orgId: string,
  ): Promise<GetDueBillingResDto[]> {
    const billingDate = new Date();
    const subscriptions =
      await this.subscriptionsRepository.getSubscriptionsDueForBilling(
        orgId,
        billingDate,
      );

    return subscriptions.map((subscription) =>
      plainToInstance(GetDueBillingResDto, subscription),
    );
  }

  async getSubscriptionStats(orgId: string, dto: GetSubscriptionStatsDto) {
    const now = new Date();
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : startOfMonth(now);
    const endDate = dto.endDate ? new Date(dto.endDate) : endOfMonth(now);

    const subscriptionStats =
      await this.subscriptionsRepository.getSubscriptionStats(
        orgId,
        startDate,
        endDate,
      );

    return plainToInstance(GetSubscriptionStatsResDto, subscriptionStats);
  }
}
