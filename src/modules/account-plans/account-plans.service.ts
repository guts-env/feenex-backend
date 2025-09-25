import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from '@/database/redis.service';
import { AccountPlansRepository } from '@/modules/account-plans/account-plans.repository';
import { REDIS_ACCOUNT_PLANS_KEY } from '@/common/constants/redis';
import { type IRepositoryAccountPlan } from '@/modules/account-plans/types/account-plans';

@Injectable()
export class AccountPlansService implements OnModuleInit {
  private readonly logger = new Logger(AccountPlansService.name);
  private readonly redisClient: Redis;

  constructor(
    private readonly redisService: RedisService,
    private readonly accountPlansRepository: AccountPlansRepository,
  ) {
    this.redisClient = this.redisService.getClient();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.warmUpCache();
      this.logger.log('Account plans cache warmed up successfully 🚀');
    } catch (error) {
      this.logger.error('Failed to warm up account plans cache:', error);
    }
  }

  private async warmUpCache(): Promise<void> {
    const plans = await this.accountPlansRepository.findAll();

    for (const plan of plans) {
      const cacheKey = `${REDIS_ACCOUNT_PLANS_KEY}:${plan.id}`;
      await this.redisClient.set(cacheKey, JSON.stringify(plan));
    }

    const allPlansKey = `${REDIS_ACCOUNT_PLANS_KEY}:all`;
    await this.redisClient.set(allPlansKey, JSON.stringify(plans));
  }

  async findById(id: string): Promise<IRepositoryAccountPlan> {
    const cacheKey = `${REDIS_ACCOUNT_PLANS_KEY}:${id}`;
    const cachedPlan = await this.redisClient.get(cacheKey);

    if (cachedPlan) {
      return JSON.parse(cachedPlan) as IRepositoryAccountPlan;
    }

    const plan = await this.accountPlansRepository.findById(id);
    await this.redisClient.set(cacheKey, JSON.stringify(plan));

    return plan;
  }

  async findAll(): Promise<IRepositoryAccountPlan[]> {
    const allPlansKey = `${REDIS_ACCOUNT_PLANS_KEY}:all`;
    const cachedPlans = await this.redisClient.get(allPlansKey);

    if (cachedPlans) {
      return JSON.parse(cachedPlans) as IRepositoryAccountPlan[];
    }

    const plans = await this.accountPlansRepository.findAll();
    await this.redisClient.set(allPlansKey, JSON.stringify(plans));

    return plans;
  }
}
