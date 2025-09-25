import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { type IRepositoryAccountPlan } from '@/modules/account-plans/types/account-plans';

@Injectable()
export class AccountPlansRepository extends BaseRepository {
  async findById(id: string): Promise<IRepositoryAccountPlan> {
    try {
      const result = await this.db
        .selectFrom('account_plans')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirstOrThrow();

      return result;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(): Promise<IRepositoryAccountPlan[]> {
    try {
      const results = await this.db
        .selectFrom('account_plans')
        .selectAll()
        .orderBy('plan_type', 'asc')
        .execute();

      return results;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
