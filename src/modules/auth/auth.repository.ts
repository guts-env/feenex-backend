import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { BaseRepository } from '@/common/modules/base/base.repository';
import {
  type IRegisterUserInput,
  type IRegisterInvitedUserInput,
  type IRepositoryAuth,
} from '@/modules/auth/types/auth';
import { AccountTypeEnum, UserRoleEnum } from '@/common/constants/enums';

@Injectable()
export class AuthRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async create(user: IRegisterUserInput): Promise<void> {
    const dbClient = await this.db.getClient();

    try {
      const { email, hashedPassword, organizationName, accountType } = user;

      await dbClient.query('BEGIN');

      const userResult: QueryResult<{ id: string }> = await dbClient.query(
        `
          INSERT INTO users (email)
          VALUES ($1)
          RETURNING id
        `,
        [email],
      );

      const userId = userResult.rows[0].id;

      await dbClient.query(
        `
          INSERT INTO auth (user_id, password)
          VALUES ($1, $2);
        `,
        [userId, hashedPassword],
      );

      const orgResult: QueryResult<{ id: string }> = await dbClient.query(
        `
        INSERT INTO organizations (name, type, created_by, updated_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
        [organizationName, accountType, userId, userId],
      );

      const orgId = orgResult.rows[0].id;

      const userRole =
        accountType === AccountTypeEnum.BUSINESS
          ? UserRoleEnum.BUSINESS_ADMIN
          : UserRoleEnum.PERSONAL_ADMIN;

      await dbClient.query(
        `
          INSERT INTO user_organizations (user_id, organization_id, role_id)
          SELECT $1, $2, id FROM roles WHERE name = $3
        `,
        [userId, orgId, userRole],
      );

      await dbClient.query('COMMIT');
    } catch (error: any) {
      await dbClient.query('ROLLBACK');
      this.handleDatabaseError(error);
    } finally {
      dbClient.release();
    }
  }

  async createInvitedUser(
    user: IRegisterInvitedUserInput,
    inviteId: string,
  ): Promise<void> {
    const dbClient = await this.db.getClient();

    try {
      const { email, hashedPassword, orgId } = user;

      await dbClient.query('BEGIN');

      const userResult: QueryResult<{ id: string }> = await dbClient.query(
        `
          INSERT INTO users (email)
          VALUES ($1)
          RETURNING id
        `,
        [email],
      );

      const userId = userResult.rows[0].id;

      await dbClient.query(
        `
          INSERT INTO auth (user_id, password)
          VALUES ($1, $2);
        `,
        [userId, hashedPassword],
      );

      const userRole = UserRoleEnum.MEMBER;

      await dbClient.query(
        `
          INSERT INTO user_organizations (user_id, organization_id, role_id)
          SELECT $1, $2, id FROM roles WHERE name = $3
        `,
        [userId, orgId, userRole],
      );

      await dbClient.query(
        `
          UPDATE invites SET used = TRUE, used_at = NOW() WHERE token = $1
        `,
        [inviteId],
      );

      await dbClient.query('COMMIT');
    } catch (error: any) {
      await dbClient.query('ROLLBACK');
      this.handleDatabaseError(error);
    } finally {
      dbClient.release();
    }
  }

  async findByUserId(id: string): Promise<IRepositoryAuth> {
    const result = await this.db
      .getDb()
      .selectFrom('auth')
      .selectAll()
      .where('user_id', '=', id)
      .executeTakeFirstOrThrow();

    return result;
  }
}
