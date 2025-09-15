import { Injectable } from '@nestjs/common';
import {
  type IBaseRepositoryUser,
  type IUserWithOrgAndRole,
} from '@/modules/users/types/users';
import { BaseRepository } from '@/common/modules/base/base.repository';

@Injectable()
export class UsersRepository extends BaseRepository {
  async findById(id: string): Promise<IUserWithOrgAndRole> {
    try {
      const result = await this.db
        .selectFrom('users as u')
        .innerJoin('user_organizations as uo', 'u.id', 'uo.user_id')
        .innerJoin('organizations as o', 'uo.organization_id', 'o.id')
        .innerJoin('roles as r', 'uo.role_id', 'r.id')
        .select([
          'u.id',
          'u.email',
          'u.first_name',
          'u.middle_name',
          'u.last_name',
          'u.created_at',
          'u.updated_at',
          'o.id as org_id',
          'o.name as org_name',
          'o.type as org_type',
          'r.id as role_id',
          'r.name as role_name',
        ])
        .where('u.id', '=', id)
        .executeTakeFirstOrThrow();

      return result;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findByEmail(
    email: string,
  ): Promise<IUserWithOrgAndRole | Partial<IBaseRepositoryUser> | undefined> {
    try {
      const result = await this.db
        .selectFrom('users as u')
        .innerJoin('user_organizations as uo', 'u.id', 'uo.user_id')
        .innerJoin('organizations as o', 'uo.organization_id', 'o.id')
        .innerJoin('roles as r', 'uo.role_id', 'r.id')
        .select([
          'u.id',
          'u.email',
          'u.first_name',
          'u.middle_name',
          'u.last_name',
          'u.created_at',
          'u.updated_at',
          'o.id as org_id',
          'o.name as org_name',
          'o.type as org_type',
          'r.id as role_id',
          'r.name as role_name',
        ])
        .where('u.email', '=', email)
        .executeTakeFirst();

      return result || undefined;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
