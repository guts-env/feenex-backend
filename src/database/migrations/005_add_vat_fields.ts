import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('expenses')
    .addColumn('or_number', 'varchar(100)')
    .addColumn('is_vat', 'boolean')
    .addColumn('vat', sql`decimal(8,2)`)
    .dropColumn('other_details')
    .execute();

  await db.schema
    .createIndex('idx_expenses_or_number')
    .on('expenses')
    .column('or_number')
    .execute();

  await db.schema
    .createIndex('idx_expenses_is_vat')
    .on('expenses')
    .column('is_vat')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_expenses_or_number').execute();
  await db.schema.dropIndex('idx_expenses_is_vat').execute();

  await db.schema
    .alterTable('expenses')
    .dropColumn('or_number')
    .dropColumn('is_vat')
    .dropColumn('vat')
    .addColumn('other_details', 'jsonb')
    .execute();
}
