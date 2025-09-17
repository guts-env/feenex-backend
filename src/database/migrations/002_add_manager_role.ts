import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TYPE user_role ADD VALUE 'manager'`.execute(db);
}
