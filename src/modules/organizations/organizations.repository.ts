import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';
import GetMembersDto from '@/modules/organizations/dto/get-members.dto';
import UpdateOrganizationDto from '@/modules/organizations/dto/update-organization.dto';
import UpdateMemberRoleDto from '@/modules/organizations/dto/update-member-role.dto';
import { DEFAULT_QUERY_LIMIT } from '@/config/db.config';
import { type IRepositoryOrganization } from '@/modules/organizations/types/organizations';
import { type IRepositoryUserWithRole } from '@/modules/users/types/users';

@Injectable()
export class OrganizationRepository extends BaseRepository {
  private get baseQuery() {
    return this.db
      .selectFrom('organizations as org')
      .innerJoin('users as u', 'org.created_by', 'u.id')
      .innerJoin('users as u2', 'org.updated_by', 'u2.id')
      .select([
        'org.id',
        'org.name',
        'org.type',
        'org.created_at',
        'org.updated_at',
        'u.id as created_by',
        'u2.id as updated_by',
      ]);
  }

  async findByUserId(userId: string): Promise<IRepositoryOrganization[]> {
    try {
      const result = await this.db
        .selectFrom('organizations as org')
        .innerJoin(
          'user_organizations as user_org',
          'org.id',
          'user_org.organization_id',
        )
        .innerJoin('users as u', 'org.created_by', 'u.id')
        .innerJoin('users as u2', 'org.updated_by', 'u2.id')
        .select([
          'org.id',
          'org.name',
          'org.type',
          'org.created_at',
          'org.updated_at',
          'u.id as created_by',
          'u2.id as updated_by',
        ])
        .where('user_org.user_id', '=', userId)
        .execute();

      return result.map((org) => ({
        ...org,
        created_by: {
          id: org.created_by,
        },
        updated_by: {
          id: org.updated_by,
        },
      }));
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findById(id: string): Promise<IRepositoryOrganization> {
    try {
      const result = await this.baseQuery
        .where('org.id', '=', id)
        .executeTakeFirstOrThrow();

      return {
        ...result,
        created_by: {
          id: result.created_by,
        },
        updated_by: {
          id: result.updated_by,
        },
      };
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findByIdAndUpdate(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<IRepositoryOrganization> {
    const { name } = dto;

    try {
      const updatedOrg = await this.db
        .updateTable('organizations')
        .set({ name })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      const result = await this.baseQuery
        .where('id', '=', updatedOrg.id)
        .executeTakeFirstOrThrow();

      return {
        ...result,
        created_by: {
          id: result.created_by,
        },
        updated_by: {
          id: result.updated_by,
        },
      };
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async getMembers(
    userId: string,
    organizationId: string,
    query: GetMembersDto,
  ): Promise<{ count: number; data: IRepositoryUserWithRole[] }> {
    const {
      roleId,
      search,
      offset,
      limit = DEFAULT_QUERY_LIMIT,
      orderBy,
    } = query;

    try {
      let membersBaseQuery = this.db
        .selectFrom('users as u')
        .innerJoin('user_organizations as uo', 'u.id', 'uo.user_id')
        .innerJoin('roles as r', 'uo.role_id', 'r.id')
        .where('uo.user_id', '!=', userId)
        .where('uo.organization_id', '=', organizationId);

      if (roleId) {
        membersBaseQuery = membersBaseQuery.where('uo.role_id', '=', roleId);
      }

      if (search) {
        membersBaseQuery = membersBaseQuery.where((qb) =>
          qb.or([
            qb('u.first_name', 'ilike', `%${search}%`),
            qb('u.last_name', 'ilike', `%${search}%`),
            qb('u.email', 'ilike', `%${search}%`),
          ]),
        );
      }

      let dbQuery = membersBaseQuery.select([
        'u.id',
        'u.email',
        'u.first_name',
        'u.middle_name',
        'u.last_name',
        'u.profile_photo',
        'u.created_at',
        'u.updated_at',
        'r.id as role_id',
        'r.name as role_name',
      ]);

      const countQuery = membersBaseQuery.select(({ fn }) => [
        fn.countAll().as('count'),
      ]);

      if (orderBy) {
        dbQuery = dbQuery.orderBy(`u.${orderBy.field}`, orderBy.order);
      } else {
        dbQuery = dbQuery.orderBy('u.created_at', 'desc');
      }

      if (offset !== undefined) {
        dbQuery = dbQuery.offset(offset);
      }
      if (limit !== undefined) {
        dbQuery = dbQuery.limit(limit);
      }

      const [rows, countResult] = await Promise.all([
        dbQuery.execute(),
        countQuery.executeTakeFirst(),
      ]);

      const count = countResult ? Number(countResult.count) : 0;

      return { count, data: rows };
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async updateMemberRole(
    updatedUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<void> {
    const { role } = dto;

    try {
      const roleObj = await this.db
        .selectFrom('roles')
        .select('id')
        .where('name', '=', role)
        .executeTakeFirstOrThrow();

      await this.db
        .updateTable('user_organizations')
        .set({ role_id: roleObj.id })
        .where('user_id', '=', updatedUserId)
        .returning('user_id')
        .executeTakeFirstOrThrow();
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async removeMember(orgId: string, removedUserId: string) {
    try {
      return this.db
        .deleteFrom('user_organizations')
        .where('user_id', '=', removedUserId)
        .where('organization_id', '=', orgId)
        .execute();
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findByIdWithPlan(organizationId: string) {
    try {
      return await this.db
        .selectFrom('organizations')
        .select(['id', 'account_plan_id'])
        .where('id', '=', organizationId)
        .executeTakeFirst();
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async getMemberCount(organizationId: string): Promise<number> {
    try {
      const result = await this.db
        .selectFrom('user_organizations')
        .select(({ fn }) => [fn.countAll().as('count')])
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();

      return result ? Number(result.count) : 0;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
