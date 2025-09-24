import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('expenses')
    .addColumn('invoice_date', 'date')
    .addColumn('payment_date', 'date')
    .execute();

  await sql`
    UPDATE expenses
    SET
      invoice_date = date,
      payment_date = date
    WHERE date IS NOT NULL
  `.execute(db);

  await sql`
    UPDATE expenses
    SET
      invoice_date = created_at::date,
      payment_date = created_at::date
    WHERE date IS NULL
  `.execute(db);

  await db.schema
    .alterTable('expenses')
    .alterColumn('invoice_date', (col) => col.setNotNull())
    .alterColumn('payment_date', (col) => col.setNotNull())
    .execute();

  await db.schema.alterTable('expenses').dropColumn('date').execute();

  await db.schema
    .createIndex('idx_expenses_invoice_date')
    .on('expenses')
    .column('invoice_date')
    .execute();

  await db.schema
    .createIndex('idx_expenses_payment_date')
    .on('expenses')
    .column('payment_date')
    .execute();

  await db.schema.dropIndex('idx_expenses_org_user_date').ifExists().execute();

  await db.schema
    .dropIndex('idx_expenses_org_status_date')
    .ifExists()
    .execute();

  await db.schema.dropIndex('idx_expenses_user_date').ifExists().execute();

  await db.schema
    .createIndex('idx_expenses_org_user_payment_date')
    .on('expenses')
    .columns(['organization_id', 'user_id', 'payment_date'])
    .execute();

  await db.schema
    .createIndex('idx_expenses_org_status_payment_date')
    .on('expenses')
    .columns(['organization_id', 'status', 'payment_date'])
    .execute();

  await db.schema
    .createIndex('idx_expenses_user_payment_date')
    .on('expenses')
    .columns(['user_id', 'payment_date'])
    .execute();

  await db.schema
    .createIndex('idx_expenses_org_invoice_date')
    .on('expenses')
    .columns(['organization_id', 'invoice_date'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('expenses').addColumn('date', 'date').execute();

  await sql`
    UPDATE expenses
    SET date = payment_date
    WHERE payment_date IS NOT NULL
  `.execute(db);

  await db.schema
    .alterTable('expenses')
    .alterColumn('date', (col) => col.setNotNull())
    .execute();

  await db.schema
    .alterTable('expenses')
    .dropColumn('invoice_date')
    .dropColumn('payment_date')
    .execute();

  await db.schema.dropIndex('idx_expenses_invoice_date').execute();
  await db.schema.dropIndex('idx_expenses_payment_date').execute();
  await db.schema.dropIndex('idx_expenses_org_user_payment_date').execute();
  await db.schema.dropIndex('idx_expenses_org_status_payment_date').execute();
  await db.schema.dropIndex('idx_expenses_user_payment_date').execute();
  await db.schema.dropIndex('idx_expenses_org_invoice_date').execute();

  await db.schema
    .createIndex('idx_expenses_org_user_date')
    .on('expenses')
    .columns(['organization_id', 'user_id', 'date'])
    .execute();

  await db.schema
    .createIndex('idx_expenses_org_status_date')
    .on('expenses')
    .columns(['organization_id', 'status', 'date'])
    .execute();

  await db.schema
    .createIndex('idx_expenses_user_date')
    .on('expenses')
    .columns(['user_id', 'date'])
    .execute();

  await db.schema
    .createIndex('idx_expenses_date')
    .on('expenses')
    .column('date')
    .execute();
}
