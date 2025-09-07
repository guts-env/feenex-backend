import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { type IPermission } from '@/modules/auth/types/auth';

@Injectable()
export class PermissionsRepository extends BaseRepository {
  async findByUserAndOrgId(
    userId: string,
    orgId: string,
  ): Promise<IPermission[]> {
    try {
      const result = await this.db
        .selectFrom('user_organizations as uo')
        .innerJoin('roles as r', 'uo.role_id', 'r.id')
        .innerJoin('role_permissions as rp', 'r.id', 'rp.role_id')
        .innerJoin('permissions as p', 'rp.permission_id', 'p.id')
        .select(['p.resource', 'p.action'])
        .where('uo.user_id', '=', userId)
        .where('uo.organization_id', '=', orgId)
        .distinct()
        .execute();

      return result;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
