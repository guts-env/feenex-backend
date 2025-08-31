import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { BaseRepository } from '@/modules/base/base.repository';
import { type AuthUser } from '@/modules/auth/types/auth';

@Injectable()
export class AuthRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async findByUserId(userId: string): Promise<AuthUser | null> {
    const result: QueryResult<AuthUser> = await this.db.query(
      `
        SELECT * FROM auth
        WHERE user_id = $1
      `,
      [userId],
    );

    return result.rows[0] || null;
  }
}
