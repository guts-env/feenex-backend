import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { BaseRepository } from '@/modules/base/base.repository';
import { type CreateUserInput, type User } from '@/modules/users/types/users';

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async create(user: CreateUserInput): Promise<void> {
    const dbClient = await this.db.getClient();

    try {
      const { email, hashed_password } = user;

      await dbClient.query('BEGIN');

      const createUserTransaction: QueryResult<User> = await dbClient.query(
        `
          INSERT INTO users (email)
          VALUES ($1)
          RETURNING id
        `,
        [email],
      );

      const createdUser = createUserTransaction.rows[0];

      await dbClient.query(
        `
          INSERT INTO auth (user_id, password)
          VALUES ($1, $2)
        `,
        [createdUser.id, hashed_password],
      );

      await dbClient.query('COMMIT');
    } catch (error: any) {
      await dbClient.query('ROLLBACK');
      this.handleDatabaseError(error);
    } finally {
      dbClient.release();
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const result: QueryResult<User> = await this.db.query(
        `
          SELECT * FROM users
          WHERE id = $1
        `,
        [id],
      );

      return result.rows[0] || null;
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
