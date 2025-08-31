import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { BaseUser, User } from '@/modules/users/types/users';
import { BaseRepository } from '@/modules/base/base.repository';

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async create(user: BaseUser): Promise<void> {
    try {
      const { email, password } = user;

      await this.db.query(
        `
          INSERT INTO users (email, password)
          VALUES ($1, $2)
        `,
        [email, password],
      );
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result: QueryResult<User> = await this.db.query(
        `
          SELECT * FROM users
          WHERE email = $1
        `,
        [email],
      );

      return result.rows[0] || null;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
