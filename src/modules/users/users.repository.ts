import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { type IRepositoryUser } from '@/modules/users/types/users';

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async findById(id: string): Promise<IRepositoryUser | null> {
    try {
      const result: QueryResult<IRepositoryUser> = await this.db.query(
        `
          SELECT 
            u.*,
            o.id as org_id,
            o.name as org_name,
            o.type as org_type,
            r.id as role_id,
            r.name as role_name
          FROM users u
            JOIN user_organizations uo ON u.id = uo.user_id
            JOIN organizations o ON uo.organization_id = o.id
            JOIN roles r ON uo.role_id = r.id
          WHERE u.id = $1
        `,
        [id],
      );

      return result.rows[0] || null;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findByEmail(
    email: string,
    isRegistration?: boolean,
  ): Promise<IRepositoryUser | null> {
    try {
      let queryStatement = `
        SELECT u.*,
          o.id as org_id,
          o.name as org_name,
          o.type as org_type,
          r.id as role_id,
          r.name as role_name
        FROM users u
        JOIN user_organizations uo ON u.id = uo.user_id
        JOIN organizations o ON uo.organization_id = o.id
        JOIN roles r ON uo.role_id = r.id
        WHERE u.email = $1
      `;

      if (isRegistration) {
        queryStatement = `SELECT * FROM users WHERE email = $1`;
      }

      const result: QueryResult<IRepositoryUser> = await this.db.query(
        queryStatement,
        [email],
      );

      return result.rows[0] || null;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
