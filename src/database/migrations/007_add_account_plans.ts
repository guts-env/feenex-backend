import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE plan_type AS ENUM ('free', 'premium', 'beta')`.execute(
    db,
  );

  await db.schema
    .createTable('account_plans')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('plan_type', sql`plan_type`, (col) => col.notNull().unique())
    .addColumn('auto_receipt_limit', 'integer', (col) => col.notNull())
    .addColumn('team_member_limit', 'integer', (col) => col.notNull())
    .addColumn('manual_receipt_limit', 'integer', (col) => col.notNull())
    .addColumn('subscription_limit', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db
    .insertInto('account_plans')
    .values([
      {
        plan_type: 'free',
        auto_receipt_limit: 60,
        team_member_limit: 1,
        manual_receipt_limit: 100,
        subscription_limit: 5,
      },
      {
        plan_type: 'premium',
        auto_receipt_limit: 1000,
        team_member_limit: 10,
        manual_receipt_limit: -1,
        subscription_limit: -1,
      },
      {
        plan_type: 'beta',
        auto_receipt_limit: 200,
        team_member_limit: 5,
        manual_receipt_limit: -1,
        subscription_limit: -1,
      },
    ])
    .execute();

  await db.schema
    .alterTable('organizations')
    .addColumn('account_plan_id', 'uuid', (col) =>
      col.references('account_plans.id').onDelete('restrict'),
    )
    .execute();

  const betaPlan = await db
    .selectFrom('account_plans')
    .select('id')
    .where('plan_type', '=', 'beta')
    .executeTakeFirst();

  if (betaPlan) {
    await db
      .updateTable('organizations')
      .set('account_plan_id', betaPlan.id)
      .execute();
  }

  await db.schema
    .createIndex('idx_account_plans_plan_type')
    .on('account_plans')
    .column('plan_type')
    .execute();

  await db.schema
    .createIndex('idx_organizations_account_plan_id')
    .on('organizations')
    .column('account_plan_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('organizations')
    .dropColumn('account_plan_id')
    .execute();

  await db.schema.dropTable('account_plans').execute();

  await sql`DROP TYPE IF EXISTS plan_type`.execute(db);
}
