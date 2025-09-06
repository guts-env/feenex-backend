import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create ENUM types first
  await sql`CREATE TYPE organization_type AS ENUM ('personal', 'business')`.execute(
    db,
  );
  await sql`CREATE TYPE permission_resource AS ENUM ('categories', 'users', 'expenses', 'organizations')`.execute(
    db,
  );
  await sql`CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'manage')`.execute(
    db,
  );
  await sql`CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed')`.execute(
    db,
  );
  await sql`CREATE TYPE expense_source AS ENUM ('manual', 'ocr', 'import', 'api')`.execute(
    db,
  );
  await sql`CREATE TYPE expense_status AS ENUM ('draft', 'pending', 'verified', 'rejected')`.execute(
    db,
  );
  await sql`CREATE TYPE currency_code AS ENUM ('PHP', 'USD', 'HKD', 'THB', 'VND')`.execute(
    db,
  );

  // Create users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('email', 'varchar(320)', (col) => col.notNull().unique())
    .addColumn('first_name', 'varchar(255)')
    .addColumn('middle_name', 'varchar(255)')
    .addColumn('last_name', 'varchar(255)')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute();

  // Create auth table
  await db.schema
    .createTable('auth')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('password', 'varchar(60)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute();

  // Create organizations table
  await db.schema
    .createTable('organizations')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar(200)', (col) => col.notNull())
    .addColumn('type', sql`organization_type`, (col) =>
      col.notNull().defaultTo('personal'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('created_by', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('updated_by', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .execute();

  // Create roles table
  await db.schema
    .createTable('roles')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar(20)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute();

  // Create permissions table
  await db.schema
    .createTable('permissions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('resource', sql`permission_resource`, (col) => col.notNull())
    .addColumn('action', sql`permission_action`, (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute();

  // Create role_permissions table
  await db.schema
    .createTable('role_permissions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('role_id', 'uuid', (col) =>
      col.notNull().references('roles.id').onDelete('cascade'),
    )
    .addColumn('permission_id', 'uuid', (col) =>
      col.notNull().references('permissions.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addUniqueConstraint('unique_role_permission', ['role_id', 'permission_id'])
    .execute();

  // Create user_organizations table
  await db.schema
    .createTable('user_organizations')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade'),
    )
    .addColumn('role_id', 'uuid', (col) => col.notNull().references('roles.id'))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addUniqueConstraint('unique_user_organization', [
      'user_id',
      'organization_id',
    ])
    .execute();

  // Create categories table
  await db.schema
    .createTable('categories')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('organization_id', 'uuid', (col) =>
      col.references('organizations.id').onDelete('cascade'),
    )
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('is_default', 'boolean', (col) => col.defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('created_by', 'uuid', (col) => col.references('users.id'))
    .addColumn('updated_by', 'uuid', (col) => col.references('users.id'))
    .addUniqueConstraint('unique_org_category_name', [
      'organization_id',
      'name',
    ])
    .addCheckConstraint(
      'default_category_check',
      sql`(
        (is_default = TRUE AND organization_id IS NULL AND created_by IS NULL AND updated_by IS NULL) OR
        (is_default = FALSE AND organization_id IS NOT NULL AND created_by IS NOT NULL AND updated_by IS NOT NULL)
      )`,
    )
    .execute();

  // Create ocr_results table
  await db.schema
    .createTable('ocr_results')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade'),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('ocr_text', 'text')
    .addColumn('entities', 'jsonb')
    .addColumn('status', sql`processing_status`, (col) =>
      col.defaultTo('pending'),
    )
    .addColumn('confidence_score', sql`decimal(5,2)`)
    .addColumn('error_message', 'text')
    .addColumn('processing_time_ms', 'integer')
    .addColumn('image_path', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute();

  // Create llm_results table
  await db.schema
    .createTable('llm_results')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('ocr_result_id', 'uuid', (col) =>
      col.notNull().references('ocr_results.id').onDelete('cascade'),
    )
    .addColumn('extracted_data', 'jsonb')
    .addColumn('status', sql`processing_status`, (col) =>
      col.defaultTo('pending'),
    )
    .addColumn('error_message', 'text')
    .addColumn('processing_time_ms', 'integer')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute();

  // Create merchants table
  await db.schema
    .createTable('merchants')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('name', 'varchar(200)', (col) => col.notNull())
    .addColumn('normalized_name', 'varchar(200)')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .execute();

  // Create imports table
  await db.schema
    .createTable('imports')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade'),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('file', 'varchar(500)', (col) => col.notNull())
    .addColumn('status', sql`processing_status`, (col) =>
      col.defaultTo('pending'),
    )
    .addColumn('total_rows', 'integer')
    .addColumn('processed_rows', 'integer', (col) => col.defaultTo(0))
    .addColumn('successful_rows', 'integer', (col) => col.defaultTo(0))
    .addColumn('failed_rows', 'integer', (col) => col.defaultTo(0))
    .addColumn('error_details', 'jsonb')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('completed_at', 'timestamptz')
    .execute();

  // Create expenses table
  await db.schema
    .createTable('expenses')
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
    .addColumn('merchant_name', 'varchar(200)', (col) => col.notNull())
    .addColumn('photos', sql`text[]`)
    .addColumn('amount', sql`decimal(5,2)`, (col) => col.notNull())
    .addColumn('currency', sql`currency_code`, (col) => col.defaultTo('PHP'))
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('items', 'jsonb')
    .addColumn('other_details', 'jsonb')
    .addColumn('ocr_result_id', 'uuid', (col) =>
      col.references('ocr_results.id'),
    )
    .addColumn('llm_result_id', 'uuid', (col) =>
      col.references('llm_results.id'),
    )
    .addColumn('source', sql`expense_source`, (col) => col.notNull())
    .addColumn('status', sql`expense_status`, (col) => col.defaultTo('pending'))
    .addColumn('verified_by', 'uuid', (col) => col.references('users.id'))
    .addColumn('import_id', 'uuid', (col) => col.references('imports.id'))
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`))
    .addColumn('created_by', 'uuid', (col) =>
      col.notNull().references('users.id'),
    )
    .addColumn('updated_by', 'uuid', (col) =>
      col.notNull().references('users.id'),
    )
    .execute();

  // Create invites table
  await db.schema
    .createTable('invites')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('organization_id', 'uuid', (col) =>
      col.references('organizations.id').onDelete('set null'),
    )
    .addColumn('role_id', 'uuid', (col) =>
      col.references('roles.id').onDelete('cascade'),
    )
    .addColumn('expires_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`NOW() + INTERVAL '7 days'`),
    )
    .addColumn('token', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('used', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('used_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('created_by', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('updated_by', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addUniqueConstraint('unique_email_organization', [
      'email',
      'organization_id',
    ])
    .execute();

  // Insert initial roles
  await db
    .insertInto('roles')
    .values([
      {
        name: 'personal_admin',
        description: 'Personal organization management',
      },
      { name: 'business_admin', description: 'Full organization access' },
      { name: 'member', description: 'Basic expense tracking access' },
    ])
    .execute();

  // Insert initial permissions
  await db
    .insertInto('permissions')
    .values([
      {
        name: 'create_expenses',
        description: 'Create expenses',
        resource: 'expenses',
        action: 'create',
      },
      {
        name: 'view_own_expenses',
        description: 'View own expenses',
        resource: 'expenses',
        action: 'read',
      },
      {
        name: 'invite_users',
        description: 'Invite users to organization',
        resource: 'users',
        action: 'create',
      },
      {
        name: 'create_categories',
        description: 'Create organization categories',
        resource: 'categories',
        action: 'create',
      },
      {
        name: 'view_all_expenses',
        description: 'View all organization expenses',
        resource: 'expenses',
        action: 'read',
      },
      {
        name: 'manage_organization',
        description: 'Manage organization settings',
        resource: 'organizations',
        action: 'manage',
      },
      {
        name: 'verify_expenses',
        description: 'Verify and approve expenses',
        resource: 'expenses',
        action: 'update',
      },
    ])
    .execute();

  // Insert role permissions - business_admin gets all permissions
  await sql`
    WITH business_admin_role AS (SELECT id FROM roles WHERE name = 'business_admin'),
         all_permissions AS (SELECT id FROM permissions)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT business_admin_role.id, all_permissions.id FROM business_admin_role, all_permissions
  `.execute(db);

  // Insert role permissions - personal_admin gets specific permissions
  await sql`
    WITH personal_admin_role AS (SELECT id FROM roles WHERE name = 'personal_admin'),
         personal_permissions AS (
           SELECT id FROM permissions 
           WHERE name IN ('create_categories', 'manage_organization', 'create_expenses', 'view_own_expenses', 'verify_expenses')
         )
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT personal_admin_role.id, personal_permissions.id FROM personal_admin_role, personal_permissions
  `.execute(db);

  // Insert role permissions - member gets basic permissions
  await sql`
    WITH member_role AS (SELECT id FROM roles WHERE name = 'member'),
         basic_permissions AS (
           SELECT id FROM permissions 
           WHERE name IN ('create_expenses', 'view_own_expenses')
         )
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT member_role.id, basic_permissions.id FROM member_role, basic_permissions
  `.execute(db);

  // Insert default categories
  await db
    .insertInto('categories')
    .values([
      {
        name: 'Food & Dining',
        description: 'Restaurants, fast food, takeout',
        is_default: true,
      },
      {
        name: 'Groceries',
        description: 'Food, toiletries, household items',
        is_default: true,
      },
      {
        name: 'Transportation',
        description: 'Gas, public transit, ride-sharing',
        is_default: true,
      },
      {
        name: 'Shopping',
        description: 'Clothing, electronics, general retail',
        is_default: true,
      },
      {
        name: 'Bills & Utilities',
        description: 'Rent, electricity, phone, internet',
        is_default: true,
      },
      {
        name: 'Entertainment',
        description: 'Movies, concerts, subscriptions, games',
        is_default: true,
      },
      {
        name: 'Healthcare',
        description: 'Medical, pharmacy, insurance',
        is_default: true,
      },
      {
        name: 'Equipment',
        description: 'Office supplies, equipment, software',
        is_default: true,
      },
      {
        name: 'Packaging',
        description: 'Packaging materials, shipping, delivery',
        is_default: true,
      },
      {
        name: 'Business',
        description: 'Business-related expenses',
        is_default: true,
      },
      {
        name: 'Other',
        description: 'Miscellaneous expenses',
        is_default: true,
      },
    ])
    .execute();

  // Create indexes
  await db.schema
    .createIndex('idx_auth_user_id')
    .on('auth')
    .column('user_id')
    .execute();
  await db.schema
    .createIndex('idx_organizations_type')
    .on('organizations')
    .column('type')
    .execute();
  await db.schema
    .createIndex('idx_user_organizations_user_id')
    .on('user_organizations')
    .column('user_id')
    .execute();
  await db.schema
    .createIndex('idx_user_organizations_organization_id')
    .on('user_organizations')
    .column('organization_id')
    .execute();
  await db.schema
    .createIndex('idx_permissions_resource')
    .on('permissions')
    .column('resource')
    .execute();
  await db.schema
    .createIndex('idx_permissions_action')
    .on('permissions')
    .column('action')
    .execute();
  await db.schema
    .createIndex('idx_role_permissions_role_id')
    .on('role_permissions')
    .column('role_id')
    .execute();
  await db.schema
    .createIndex('idx_role_permissions_permission_id')
    .on('role_permissions')
    .column('permission_id')
    .execute();
  await db.schema
    .createIndex('idx_categories_organization_id')
    .on('categories')
    .column('organization_id')
    .execute();
  await db.schema
    .createIndex('idx_categories_is_default')
    .on('categories')
    .column('is_default')
    .execute();
  await db.schema
    .createIndex('idx_ocr_results_user_id')
    .on('ocr_results')
    .column('user_id')
    .execute();
  await db.schema
    .createIndex('idx_ocr_results_organization_id')
    .on('ocr_results')
    .column('organization_id')
    .execute();
  await db.schema
    .createIndex('idx_ocr_results_status')
    .on('ocr_results')
    .column('status')
    .execute();
  await db.schema
    .createIndex('idx_llm_results_ocr_result_id')
    .on('llm_results')
    .column('ocr_result_id')
    .execute();
  await db.schema
    .createIndex('idx_llm_results_status')
    .on('llm_results')
    .column('status')
    .execute();
  await db.schema
    .createIndex('idx_merchants_normalized_name')
    .on('merchants')
    .column('normalized_name')
    .execute();
  await db.schema
    .createIndex('idx_expenses_organization_id')
    .on('expenses')
    .column('organization_id')
    .execute();
  await db.schema
    .createIndex('idx_expenses_user_id')
    .on('expenses')
    .column('user_id')
    .execute();
  await db.schema
    .createIndex('idx_expenses_category_id')
    .on('expenses')
    .column('category_id')
    .execute();
  await db.schema
    .createIndex('idx_expenses_status')
    .on('expenses')
    .column('status')
    .execute();
  await db.schema
    .createIndex('idx_expenses_date')
    .on('expenses')
    .column('date')
    .execute();
  await db.schema
    .createIndex('idx_expenses_merchant_name')
    .on('expenses')
    .column('merchant_name')
    .execute();
  await db.schema
    .createIndex('idx_invites_expires_at')
    .on('invites')
    .column('expires_at')
    .execute();
  await db.schema
    .createIndex('idx_invites_used')
    .on('invites')
    .column('used')
    .execute();
  await db.schema
    .createIndex('idx_invites_organization_id')
    .on('invites')
    .column('organization_id')
    .execute();
  await db.schema
    .createIndex('idx_invites_created_by')
    .on('invites')
    .column('created_by')
    .execute();
  await db.schema
    .createIndex('idx_invites_token')
    .on('invites')
    .column('token')
    .execute();

  // Create composite indexes
  await db.schema
    .createIndex('idx_categories_org_default')
    .on('categories')
    .columns(['organization_id', 'is_default'])
    .execute();
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
    .createIndex('idx_expenses_user_status')
    .on('expenses')
    .columns(['user_id', 'status'])
    .execute();
  await db.schema
    .createIndex('idx_permissions_resource_action')
    .on('permissions')
    .columns(['resource', 'action'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order (due to foreign key constraints)
  await db.schema.dropTable('invites').execute();
  await db.schema.dropTable('expenses').execute();
  await db.schema.dropTable('imports').execute();
  await db.schema.dropTable('merchants').execute();
  await db.schema.dropTable('llm_results').execute();
  await db.schema.dropTable('ocr_results').execute();
  await db.schema.dropTable('categories').execute();
  await db.schema.dropTable('user_organizations').execute();
  await db.schema.dropTable('role_permissions').execute();
  await db.schema.dropTable('permissions').execute();
  await db.schema.dropTable('roles').execute();
  await db.schema.dropTable('organizations').execute();
  await db.schema.dropTable('auth').execute();
  await db.schema.dropTable('users').execute();

  // Drop ENUM types
  await sql`DROP TYPE IF EXISTS currency_code`.execute(db);
  await sql`DROP TYPE IF EXISTS expense_status`.execute(db);
  await sql`DROP TYPE IF EXISTS expense_source`.execute(db);
  await sql`DROP TYPE IF EXISTS processing_status`.execute(db);
  await sql`DROP TYPE IF EXISTS permission_action`.execute(db);
  await sql`DROP TYPE IF EXISTS permission_resource`.execute(db);
  await sql`DROP TYPE IF EXISTS organization_type`.execute(db);
}
