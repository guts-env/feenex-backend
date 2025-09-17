import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db
    .insertInto('roles')
    .values({
      name: 'manager',
      description: 'Manager role with full permissions',
    })
    .execute();

  await sql`
    WITH manager_role AS (SELECT id FROM roles WHERE name = 'manager'),
         all_permissions AS (SELECT id FROM permissions)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role.id, all_permissions.id FROM manager_role, all_permissions
  `.execute(db);
}
