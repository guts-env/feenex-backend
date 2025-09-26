import { Injectable } from '@nestjs/common';
import { startOfDay, endOfDay } from 'date-fns';
import { SelectQueryBuilder } from 'kysely';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { GetSubscriptionsDto } from './dto/get-subscriptions.dto';
import {
  type CurrencyCode,
  type SubscriptionStatus,
  type RecurringFrequency,
} from '@/database/types/db';
import { calculateNextBillingDate } from '@/utils/subscription.utils';
import { type IBaseRepositorySubscription } from '@/modules/subscriptions/types/subscriptions';

@Injectable()
export class SubscriptionsRepository extends BaseRepository {
  private addSubscriptionSelections(query: SelectQueryBuilder<any, any, any>) {
    return query.select([
      's.id',
      's.organization_id',
      's.user_id',
      's.category_id',
      's.merchant_name',
      's.amount',
      's.currency',
      's.description',
      's.frequency',
      's.start_date',
      's.end_date',
      's.billing_date',
      's.status',
      's.is_vat',
      's.vat',
      's.created_at',
      's.updated_at',
      's.created_by',
      's.updated_by',
      'c.name as category_name',
      'u.first_name as user_first_name',
      'u.last_name as user_last_name',
      'u.email as user_email',
      'u.first_name as created_by_first_name',
      'u.last_name as created_by_last_name',
      'u.middle_name as created_by_middle_name',
      'u.first_name as updated_by_first_name',
      'u.last_name as updated_by_last_name',
      'u.middle_name as updated_by_middle_name',
    ]);
  }

  private transformSubscriptionRow(
    row: Record<string, any>,
  ): IBaseRepositorySubscription {
    return {
      id: row['id'] as string,
      merchant_name: row['merchant_name'] as string,
      amount: row['amount'] ? Number(row['amount']) : 0,
      currency: row['currency'] as CurrencyCode,
      category_name: row['category_name'] as string,
      description: row['description'] as string | null,
      frequency: row['frequency'] as RecurringFrequency,
      start_date: row['start_date'] as Date,
      end_date: row['end_date'] as Date | null,
      billing_date: row['billing_date'] as Date,
      status: row['status'] as SubscriptionStatus,
      is_vat: row['is_vat'] as boolean | null,
      vat: row['vat'] ? Number(row['vat']) : null,
      created_at: row['created_at'] as Date,
      updated_at: row['updated_at'] as Date,
      created_by: {
        id: row['created_by'] as string,
        first_name: row['created_by_first_name'] as string,
        last_name: row['created_by_last_name'] as string,
        middle_name: row['created_by_middle_name'] as string,
      },
      updated_by: {
        id: row['updated_by'] as string,
        first_name: row['updated_by_first_name'] as string,
        last_name: row['updated_by_last_name'] as string,
        middle_name: row['updated_by_middle_name'] as string,
      },
      category: {
        id: row['category_id'] as string,
        name: row['category_name'] as string,
      },
    };
  }

  async create(orgId: string, userId: string, dto: CreateSubscriptionDto) {
    const {
      categoryId,
      merchantName,
      amount,
      currency,
      description,
      frequency,
      startDate,
      endDate,
      isVat,
      vat,
    } = dto;

    const billingDate = calculateNextBillingDate(
      new Date(startDate),
      frequency,
    );

    try {
      const subscription = await this.db
        .insertInto('subscriptions')
        .values({
          organization_id: orgId,
          user_id: userId,
          category_id: categoryId,
          merchant_name: merchantName,
          amount,
          currency: (currency as CurrencyCode) || 'PHP',
          description: description || null,
          frequency,
          start_date: new Date(startDate),
          end_date: endDate ? new Date(endDate) : null,
          billing_date: new Date(billingDate),
          status: 'active',
          is_vat: isVat || null,
          vat: vat || null,
          created_by: userId,
          updated_by: userId,
        })
        .returning([
          'id',
          'merchant_name',
          'amount',
          'frequency',
          'billing_date',
        ])
        .executeTakeFirstOrThrow();

      return subscription;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async getSubscriptions(
    orgId: string,
    query: GetSubscriptionsDto,
  ): Promise<{ count: number; data: IBaseRepositorySubscription[] }> {
    const {
      categoryIds,
      statuses,
      frequency,
      isVat,
      startDate,
      endDate,
      billingStartDate,
      billingEndDate,
      search,
      offset,
      limit,
      orderBy,
    } = query;

    try {
      let subscriptionsBaseQuery = this.db
        .selectFrom('subscriptions as s')
        .innerJoin('categories as c', 'c.id', 's.category_id')
        .innerJoin('users as u', 'u.id', 's.user_id')
        .where('s.organization_id', '=', orgId);

      if (categoryIds && categoryIds.length > 0) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where(
          's.category_id',
          'in',
          categoryIds,
        );
      }

      if (statuses && statuses.length > 0) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where(
          's.status',
          'in',
          statuses,
        );
      }

      if (frequency) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where(
          's.frequency',
          '=',
          frequency,
        );
      }

      if (isVat !== undefined) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where(
          's.is_vat',
          '=',
          isVat,
        );
      }

      if (search) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where((eb) =>
          eb.or([
            eb('s.merchant_name', 'ilike', `%${search}%`),
            eb('s.description', 'ilike', `%${search}%`),
          ]),
        );
      }

      if (startDate) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where(
          's.start_date',
          '>=',
          startDate,
        );
      }

      if (endDate) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where(
          's.end_date',
          '<=',
          endDate,
        );
      }

      if (billingStartDate) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where(
          's.billing_date',
          '>=',
          billingStartDate,
        );
      }

      if (billingEndDate) {
        subscriptionsBaseQuery = subscriptionsBaseQuery.where(
          's.billing_date',
          '<=',
          billingEndDate,
        );
      }

      let dbQuery = this.addSubscriptionSelections(subscriptionsBaseQuery);
      const countQuery = subscriptionsBaseQuery.select(({ fn }) => [
        fn.countAll().as('count'),
      ]);

      if (orderBy) {
        dbQuery = dbQuery.orderBy(`s.${orderBy.field}`, orderBy.order);
      } else {
        dbQuery = dbQuery.orderBy('s.created_at', 'desc');
      }

      if (offset) {
        dbQuery = dbQuery.offset(offset);
      }

      if (limit) {
        dbQuery = dbQuery.limit(limit);
      }

      const [rows, countResult] = await Promise.all([
        dbQuery.execute(),
        countQuery.executeTakeFirst(),
      ]);

      const count = countResult ? Number(countResult.count) : 0;

      return {
        count,
        data: rows.map((row) => this.transformSubscriptionRow(row)),
      };
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findById(
    id: string,
    orgId: string,
  ): Promise<IBaseRepositorySubscription> {
    const query = this.db
      .selectFrom('subscriptions as s')
      .innerJoin('categories as c', 'c.id', 's.category_id')
      .innerJoin('users as u', 'u.id', 's.user_id')
      .where('s.id', '=', id)
      .where('s.organization_id', '=', orgId);

    const subscription =
      await this.addSubscriptionSelections(query).executeTakeFirstOrThrow();

    return this.transformSubscriptionRow(subscription);
  }

  async update(
    id: string,
    userId: string,
    orgId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<IBaseRepositorySubscription> {
    const {
      categoryId,
      merchantName,
      amount,
      currency,
      description,
      frequency,
      startDate,
      endDate,
      status,
      isVat,
      vat,
    } = dto;

    const updateObj = {};

    if (categoryId !== undefined) updateObj['category_id'] = categoryId;
    if (merchantName !== undefined) updateObj['merchant_name'] = merchantName;
    if (amount !== undefined) updateObj['amount'] = amount;
    if (currency !== undefined) updateObj['currency'] = currency;
    if (description !== undefined) updateObj['description'] = description;
    if (frequency !== undefined) updateObj['frequency'] = frequency;
    if (startDate !== undefined) updateObj['start_date'] = startDate;
    if (endDate !== undefined) updateObj['end_date'] = endDate;
    if (status !== undefined) updateObj['status'] = status;
    if (isVat !== undefined) updateObj['is_vat'] = isVat;
    if (vat !== undefined) updateObj['vat'] = vat;

    if (startDate !== undefined || frequency !== undefined) {
      const existing = await this.findById(id, orgId);
      const newStartDate = startDate || existing.start_date;
      const newFrequency = frequency || existing.frequency;
      updateObj['billing_date'] = calculateNextBillingDate(
        new Date(newStartDate),
        newFrequency,
      );
    }

    updateObj['updated_by'] = userId;
    updateObj['updated_at'] = new Date();

    try {
      const updatedSubscription = await this.db
        .updateTable('subscriptions')
        .set(updateObj)
        .where('id', '=', id)
        .where('organization_id', '=', orgId)
        .returningAll()
        .executeTakeFirstOrThrow();

      const result = await this.addSubscriptionSelections(
        this.db
          .selectFrom('subscriptions as s')
          .innerJoin('categories as c', 'c.id', 's.category_id')
          .innerJoin('users as u', 'u.id', 's.user_id'),
      )
        .where('s.id', '=', updatedSubscription.id)
        .executeTakeFirstOrThrow();

      return this.transformSubscriptionRow(result);
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async delete(id: string, orgId: string) {
    try {
      const subscription = await this.db
        .deleteFrom('subscriptions')
        .where('id', '=', id)
        .where('organization_id', '=', orgId)
        .returningAll()
        .executeTakeFirstOrThrow();

      return subscription;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async getActiveSubscriptionsBilling(orgId: string) {
    const query = await this.db
      .selectFrom('subscriptions')
      .select(['merchant_name', 'amount', 'billing_date'])
      .where('organization_id', '=', orgId)
      .where('status', '=', 'active')
      .orderBy('billing_date', 'asc')
      .execute();

    return query;
  }

  async getSubscriptionsDueForBilling(orgId: string, date: Date) {
    const start = startOfDay(date);
    const end = endOfDay(date);

    const query = await this.db
      .selectFrom('subscriptions')
      .select([
        'id',
        'merchant_name',
        'amount',
        'currency',
        'frequency',
        'billing_date',
        'status',
      ])
      .where('organization_id', '=', orgId)
      .where('status', '=', 'active')
      .where('billing_date', '>=', start)
      .where('billing_date', '<=', end)
      .where('start_date', '<=', end)
      .where((eb) =>
        eb.or([eb('end_date', 'is', null), eb('end_date', '>=', start)]),
      )
      .execute();

    return query;
  }

  async getSubscriptionStats(
    orgId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    activeCount: number;
    activeAmount: number;
    suspendedCount: number;
    cancelledCount: number;
  }> {
    try {
      const subscriptions = await this.db
        .selectFrom('subscriptions')
        .select([
          'id',
          'amount',
          'frequency',
          'billing_date',
          'start_date',
          'end_date',
          'status',
        ])
        .where('organization_id', '=', orgId)
        .where('start_date', '<=', endDate)
        .where((eb) =>
          eb.or([eb('end_date', 'is', null), eb('end_date', '>=', startDate)]),
        )
        .execute();

      let activeCount = 0;
      let activeAmount = 0;
      let suspendedCount = 0;
      let cancelledCount = 0;

      for (const sub of subscriptions) {
        if (sub.status === 'suspended') {
          suspendedCount++;
        } else if (sub.status === 'cancelled') {
          cancelledCount++;
        } else if (sub.status === 'active') {
          activeCount++;

          const billingCount = this.calculateBillingOccurrences(
            new Date(sub.billing_date),
            sub.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
            startDate,
            endDate,
            new Date(sub.start_date),
            sub.end_date ? new Date(sub.end_date) : null,
          );

          activeAmount += Number(sub.amount) * billingCount;
        }
      }

      return {
        activeCount,
        activeAmount,
        suspendedCount,
        cancelledCount,
      };
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  private calculateBillingOccurrences(
    billingDate: Date,
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    rangeStart: Date,
    rangeEnd: Date,
    subscriptionStart: Date,
    subscriptionEnd: Date | null,
  ): number {
    let count = 0;
    let currentBillingDate = new Date(billingDate);

    while (currentBillingDate < subscriptionStart) {
      currentBillingDate = calculateNextBillingDate(
        currentBillingDate,
        frequency,
      );
    }

    while (currentBillingDate <= rangeEnd) {
      if (
        currentBillingDate >= rangeStart &&
        currentBillingDate >= subscriptionStart &&
        (!subscriptionEnd || currentBillingDate <= subscriptionEnd)
      ) {
        count++;
      }
      currentBillingDate = calculateNextBillingDate(
        currentBillingDate,
        frequency,
      );
    }

    return count;
  }

  async getSubscriptionCount(organizationId: string): Promise<number> {
    try {
      const result = await this.db
        .selectFrom('subscriptions')
        .select(({ fn }) => [fn.countAll().as('count')])
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();

      return result ? Number(result.count) : 0;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
