import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { BaseRepository } from '@/common/modules/base/base.repository';
import {
  type IRegisterUserInput,
  type IAuthUser,
} from '@/modules/auth/types/auth';
import { AccountTypeEnum } from '@/common/constants/enums';

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
          ? 'business_admin'
          : 'personal_admin';

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

  async findByUserId(id: string): Promise<IAuthUser | null> {
    const result: QueryResult<IAuthUser> = await this.db.query(
      `
        SELECT * FROM auth
        WHERE user_id = $1
      `,
      [id],
    );

    return result.rows[0] || null;
  }
}
