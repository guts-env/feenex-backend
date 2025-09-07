import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';
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

  trx(): Kysely<DB> {
    return this.db;
  }

  getClient() {
    return this.pool.connect();
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  private addOrganizationFilter(sql: string, orgParamIndex: number): string {
    const orgParam = `$${orgParamIndex}`;

    if (sql.toLowerCase().includes('where')) {
      return sql.replace(/where/i, `WHERE organization_id = ${orgParam} AND`);
    } else {
      return sql + ` WHERE organization_id = ${orgParam}`;
    }
  }

  async isolatedQuery<T extends QueryResultRow = any>(
    sql: string,
    params: any[],
    organizationId: string,
  ): Promise<QueryResult<T>> {
    const orgScopedSql = this.addOrganizationFilter(sql, params.length + 1);

    const queryParams: any[] = [];
    if (Array.isArray(params)) {
      for (const param of params) {
        queryParams.push(param);
      }
    } else {
      queryParams.push(params);
    }
    queryParams.push(organizationId);

    return this.query(orgScopedSql, queryParams);
  }
}
