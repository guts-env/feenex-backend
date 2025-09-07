import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';
import {
  type IRegisterUserInput,
  type IRegisterInvitedUserInput,
  type IRepositoryAuth,
} from '@/modules/auth/types/auth';
import { sql } from 'kysely';

@Injectable()
export class AuthRepository extends BaseRepository {
  async create(user: IRegisterUserInput): Promise<void> {
    const trx = await this.db.startTransaction().execute();

    try {
      const { email, hashedPassword, organizationName, orgType } = user;

      const newUser = await trx
        .insertInto('users')
        .values({ email })
        .returning('id')
        .executeTakeFirstOrThrow();

      const userId = newUser.id;

      await trx
        .insertInto('auth')
        .values({ user_id: userId, password: hashedPassword })
        .execute();

      const newOrg = await trx
        .insertInto('organizations')
        .values({
          name: organizationName,
          type: orgType,
          created_by: userId,
          updated_by: userId,
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
      const { email, hashedPassword, orgId } = user;

      const newUser = await trx
        .insertInto('users')
        .values({ email })
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

  async findByUserId(id: string): Promise<IRepositoryAuth> {
    const result = await this.db
      .selectFrom('auth')
      .selectAll()
      .where('user_id', '=', id)
      .executeTakeFirstOrThrow();

    return result;
  }
}
