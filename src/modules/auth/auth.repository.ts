import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';
import {
  type IRegisterUserInput,
  type IRegisterInvitedUserInput,
  type IRepositoryAuth,
} from '@/modules/auth/types/auth';
import { sql } from 'kysely';
import { IUserWithOrgAndRole } from '../users/types/users';
import { isBefore } from 'date-fns';

@Injectable()
export class AuthRepository extends BaseRepository {
  async create(user: IRegisterUserInput): Promise<void> {
    const trx = await this.db.startTransaction().execute();

    try {
      const {
        email,
        hashedPassword,
        orgName,
        orgType,
        firstName,
        lastName,
        middleName,
      } = user;

      const newUser = await trx
        .insertInto('users')
        .values({
          email,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      const userId = newUser.id;

      await trx
        .insertInto('auth')
        .values({ user_id: userId, password: hashedPassword })
        .execute();

      // Determine plan type based on date
      // Before October 27, 2025 = beta plan, after = free plan
      const cutoffDate = new Date('2025-10-27');
      const currentDate = new Date();
      const planType = isBefore(currentDate, cutoffDate) ? 'beta' : 'free';

      const accountPlan = await trx
        .selectFrom('account_plans')
        .select('id')
        .where('plan_type', '=', planType)
        .executeTakeFirstOrThrow();

      const newOrg = await trx
        .insertInto('organizations')
        .values({
          name: orgName,
          type: orgType,
          created_by: userId,
          updated_by: userId,
          account_plan_id: accountPlan.id,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      const orgId = newOrg.id;

      const userRole =
        orgType === 'business' ? 'business_admin' : 'personal_admin';

      const role = await trx
        .selectFrom('roles')
        .select('id')
        .where('name', '=', userRole)
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('user_organizations')
        .values({
          user_id: userId,
          organization_id: orgId,
          role_id: role.id,
        })
        .execute();

      await trx.commit().execute();
    } catch (error: any) {
      await trx.rollback().execute();
      this.handleDatabaseError(error);
    }
  }

  async createInvitedUser(
    user: IRegisterInvitedUserInput,
    inviteId: string,
  ): Promise<void> {
    const trx = await this.db.startTransaction().execute();

    try {
      const { email, hashedPassword, orgId, firstName, lastName, middleName } =
        user;

      const newUser = await trx
        .insertInto('users')
        .values({
          email,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      const userId = newUser.id;

      await trx
        .insertInto('auth')
        .values({ user_id: userId, password: hashedPassword })
        .execute();

      const userRole = 'member';
      const role = await trx
        .selectFrom('roles')
        .select('id')
        .where('name', '=', userRole)
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('user_organizations')
        .values({ user_id: userId, organization_id: orgId, role_id: role.id })
        .execute();

      await trx
        .updateTable('invites')
        .set({ used: true, used_at: sql`NOW()` })
        .where('id', '=', inviteId)
        .execute();

      await trx.commit().execute();
    } catch (error: any) {
      await trx.rollback().execute();
      this.handleDatabaseError(error);
    }
  }

  async findByUserId(userId: string): Promise<IRepositoryAuth> {
    const result = await this.db
      .selectFrom('auth')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirstOrThrow();

    return result;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.db
      .updateTable('auth')
      .set({ password: hashedPassword })
      .where('id', '=', id)
      .execute();
  }

  async requestResetPassword(id: string, hashedToken: string): Promise<void> {
    await this.db
      .updateTable('auth')
      .set({
        reset_password_token: hashedToken,
        reset_password_token_expires_at: sql`NOW() + INTERVAL '1 hour'`,
      })
      .where('id', '=', id)
      .execute();
  }

  async resetPassword(id: string, hashedPassword: string): Promise<void> {
    await this.db
      .updateTable('auth')
      .set({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_token_expires_at: null,
      })
      .where('id', '=', id)
      .execute();
  }

  async migrateBetaPlanToFree(organizationId: string): Promise<void> {
    try {
      const org = await this.db
        .selectFrom('organizations as o')
        .leftJoin('account_plans as ap', 'o.account_plan_id', 'ap.id')
        .select(['o.id', 'ap.plan_type'])
        .where('o.id', '=', organizationId)
        .executeTakeFirst();

      if (org?.plan_type !== 'beta') {
        return;
      }

      const freePlan = await this.db
        .selectFrom('account_plans')
        .select('id')
        .where('plan_type', '=', 'free')
        .executeTakeFirstOrThrow();

      await this.db
        .updateTable('organizations')
        .set({ account_plan_id: freePlan.id })
        .where('id', '=', organizationId)
        .execute();
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findUserWithAuthByEmail(email: string) {
    const result = await this.userWithAuthBaseQuery
      .where('u.email', '=', email)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.transformUserWithAuth(result);
  }

  async findUserWithAuthByUserId(userId: string) {
    const result = await this.userWithAuthBaseQuery
      .where('u.id', '=', userId)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.transformUserWithAuth(result);
  }

  async findAuthByResetPasswordToken(token: string) {
    const result = await this.db
      .selectFrom('auth')
      .selectAll()
      .where('reset_password_token', '=', token)
      .executeTakeFirst();

    return result;
  }

  private get userWithAuthBaseQuery() {
    return this.db
      .selectFrom('users as u')
      .innerJoin('user_organizations as uo', 'u.id', 'uo.user_id')
      .innerJoin('organizations as o', 'uo.organization_id', 'o.id')
      .innerJoin('roles as r', 'uo.role_id', 'r.id')
      .innerJoin('auth as a', 'u.id', 'a.user_id')
      .select([
        'u.id',
        'u.email',
        'u.first_name',
        'u.middle_name',
        'u.last_name',
        'u.created_at',
        'u.updated_at',
        'o.id as org_id',
        'o.name as org_name',
        'o.type as org_type',
        'r.id as role_id',
        'r.name as role_name',
        'a.id as auth_id',
        'a.user_id as auth_user_id',
        'a.password',
        'a.reset_password_token',
        'a.reset_password_token_expires_at',
        'a.created_at as auth_created_at',
        'a.updated_at as auth_updated_at',
      ]);
  }

  private transformUserWithAuth(
    result: IUserWithOrgAndRole & {
      auth_id: string;
      auth_user_id: string;
      password: string;
      reset_password_token?: string | null;
      reset_password_token_expires_at?: Date | null;
      auth_created_at: Date;
      auth_updated_at: Date;
    },
  ) {
    return {
      user: {
        id: result.id,
        email: result.email,
        first_name: result.first_name,
        middle_name: result.middle_name,
        last_name: result.last_name,
        created_at: result.created_at,
        updated_at: result.updated_at,
        organization: {
          id: result.org_id,
          name: result.org_name,
          type: result.org_type,
        },
        role: {
          id: result.role_id,
          name: result.role_name,
        },
      },
      auth: {
        id: result.auth_id,
        user_id: result.auth_user_id,
        password: result.password,
        reset_password_token: result.reset_password_token,
        reset_password_token_expires_at: result.reset_password_token_expires_at,
        created_at: result.auth_created_at,
        updated_at: result.auth_updated_at,
      },
    };
  }
}
