import * as path from 'path';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import { config } from 'dotenv';
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from 'kysely';

config();

async function migrateToLatest() {
  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../database/migrations'),
    }),
  });

  let hasMore = true;

  while (hasMore) {
    const { error, results } = await migrator.migrateUp();

    results?.forEach((it) => {
      if (it.status === 'Success') {
        console.log(
          `migration "${it.migrationName}" was executed successfully`,
        );
      } else if (it.status === 'Error') {
        console.error(`failed to execute migration "${it.migrationName}"`);
      }
    });

    if (error) {
      console.error('failed to migrate');
      console.error(error);
      process.exit(1);
    }

    hasMore = (results?.length ?? 0) > 0;
  }

  await db.destroy();
}

migrateToLatest().catch((error) => {
  console.error(error);
  process.exit(1);
});
