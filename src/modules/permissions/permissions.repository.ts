import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { type IPermission } from '@/modules/auth/types/auth';

@Injectable()
export class PermissionsRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async findByUserAndOrgId(
    userId: string,
    orgId: string,
  ): Promise<IPermission[]> {
    try {
      const result: QueryResult<IPermission> = await this.db.query(
        `
          SELECT DISTINCT p.resource, p.action
          FROM user_organizations uo
          INNER JOIN roles r ON uo.role_id = r.id
          INNER JOIN role_permissions rp ON r.id = rp.role_id  
          INNER JOIN permissions p ON rp.permission_id = p.id
          WHERE uo.user_id = $1 AND uo.organization_id = $2
        `,
        [userId, orgId],
      );

      return result.rows;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
