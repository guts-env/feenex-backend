import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import {
  DATABASE_URL_CONFIG_KEY,
  NODE_ENV_CONFIG_KEY,
} from '@/config/keys.config';
import { type DB } from '@/database/types/db';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private db!: Kysely<DB>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      connectionString: this.configService.get<string>(DATABASE_URL_CONFIG_KEY),
      ssl:
        this.configService.get<string>(NODE_ENV_CONFIG_KEY) === 'production'
          ? {
              rejectUnauthorized: false,
              ca: readFileSync(
                join(process.cwd(), 'ap-southeast-1-bundle.pem'),
              ),
            }
          : false,
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
