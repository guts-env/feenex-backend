import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly')`.execute(
    db,
  );

  await sql`CREATE TYPE subscription_status AS ENUM ('active', 'suspended', 'cancelled')`.execute(
    db,
  );

  await db.schema
    .createTable('subscriptions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade'),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('category_id', 'uuid', (col) =>
      col.notNull().references('categories.id'),
    )
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('merchant_name', 'varchar(200)', (col) => col.notNull())
    .addColumn('amount', sql`decimal(8,2)`, (col) => col.notNull())
    .addColumn('currency', sql`currency_code`, (col) =>
      col.notNull().defaultTo('PHP'),
    )
    .addColumn('description', 'text')
    .addColumn('frequency', sql`recurring_frequency`, (col) => col.notNull())
    .addColumn('start_date', 'date', (col) => col.notNull())
    .addColumn('end_date', 'date')
    .addColumn('billing_date', 'date', (col) => col.notNull())
    .addColumn('status', sql`subscription_status`, (col) =>
      col.notNull().defaultTo('active'),
    )
    .addColumn('is_vat', 'boolean')
    .addColumn('vat', sql`decimal(8,2)`)
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('created_by', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('set null'),
    )
    .addColumn('updated_by', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .alterTable('expenses')
    .addColumn('subscription_id', 'uuid', (col) =>
      col.references('subscriptions.id').onDelete('set null'),
    )
    .addColumn('is_subscription', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
    .execute();

  await db.schema
    .createIndex('idx_subscriptions_organization_id')
    .on('subscriptions')
    .column('organization_id')
    .execute();

  await db.schema
    .createIndex('idx_subscriptions_user_id')
    .on('subscriptions')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_subscriptions_status')
    .on('subscriptions')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_subscriptions_frequency')
    .on('subscriptions')
    .column('frequency')
    .execute();

  await db.schema
    .createIndex('idx_subscriptions_org_status')
    .on('subscriptions')
    .columns(['organization_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_subscriptions_user_status')
    .on('subscriptions')
    .columns(['user_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_subscriptions_billing_date')
    .on('subscriptions')
    .column('billing_date')
    .execute();

  await db.schema
    .createIndex('idx_expenses_subscription_id')
    .on('expenses')
    .column('subscription_id')
    .execute();

  await db.schema
    .createIndex('idx_expenses_is_subscription')
    .on('expenses')
    .column('is_subscription')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('expenses')
    .dropColumn('subscription_id')
    .dropColumn('is_subscription')
    .execute();

  await db.schema.dropTable('subscriptions').execute();

  await sql`DROP TYPE IF EXISTS subscription_status`.execute(db);
  await sql`DROP TYPE IF EXISTS recurring_frequency`.execute(db);
}
