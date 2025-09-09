import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { DATABASE_URL_CONFIG_KEY } from '@/config/keys.config';
import { type DB } from '@/database/types/db';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private db!: Kysely<DB>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      connectionString: this.configService.get<string>(DATABASE_URL_CONFIG_KEY),
      max: 25,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: this.pool,
      }),
    });
  }

  async onModuleDestroy() {
    await this.db.destroy();
    await this.pool.end();
  }

  getDb(): Kysely<DB> {
    return this.db;
  }
}
