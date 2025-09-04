import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { BaseRepository } from '@/common/modules/base/base.repository';
import GetMembersDto, {
  type GetMembersDtoValues,
} from '@/modules/organizations/dto/get-members.dto';
import UpdateOrganizationDto from '@/modules/organizations/dto/update-organization.dto';
import RemoveMemberDto from '@/modules/organizations/dto/remove-member.dto';
import UpdateMemberRoleDto from '@/modules/organizations/dto/update-member-role.dto';
import { type IRepositoryOrganization } from '@/modules/organizations/types/organizations';
import { type IRepositoryUser } from '@/modules/users/types/users';

@Injectable()
export class OrganizationRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async findByUserId(id: string): Promise<IRepositoryOrganization[]> {
    try {
      const result: QueryResult<IRepositoryOrganization> = await this.db.query(
        `
        SELECT org.*
        FROM organizations org
        JOIN user_organizations user_org
        ON org.id = user_org.organization_id
        WHERE user_org.user_id = $1
      `,
        [id],
      );

      return result.rows;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async findById(id: string): Promise<IRepositoryOrganization> {
    try {
      const result: QueryResult<IRepositoryOrganization> = await this.db.query(
        `
        SELECT org.*
        FROM organizations org
        WHERE org.id = $1
      `,
        [id],
      );

      return result.rows[0];
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
      const result: QueryResult<IRepositoryOrganization> = await this.db.query(
        `
        UPDATE organizations
        SET name = $1
        WHERE id = $2
        RETURNING *
      `,
        [name, id],
      );

      return result.rows[0];
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async getMembers(
    userId: string,
    organizationId: string,
    query: GetMembersDto,
  ): Promise<IRepositoryUser[]> {
    const { roleId, search, offset, limit } = query;

    let conditionIndex = 2;
    const conditions: string[] = [];
    const params: GetMembersDtoValues = [];

    if (roleId) {
      conditions.push(`uo.role_id = $${conditionIndex}`);
      params.push(roleId);
      conditionIndex++;
    }

    if (search) {
      conditions.push(
        `(u.first_name ILIKE $${conditionIndex} OR u.last_name ILIKE $${conditionIndex} OR u.email ILIKE $${conditionIndex})`,
      );
      params.push(`%${search}%`);
      conditionIndex++;
    }

    if (offset) {
      conditions.push(`OFFSET $${conditionIndex}`);
      params.push(offset);
      conditionIndex++;
    }

    if (limit) {
      conditions.push(`LIMIT $${conditionIndex}`);
      params.push(limit);
      conditionIndex++;
    }

    try {
      const result: QueryResult<IRepositoryUser> = await this.db.isolatedQuery(
        `
        SELECT u.*
        FROM users u
        JOIN user_organizations uo ON u.id = uo.user_id
        WHERE uo.user_id != $1
        ${params.length > 0 ? `AND ${conditions.join(' AND ')}` : ''}
      `,
        [userId, ...params],
        organizationId,
      );

      return result.rows;
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async updateMemberRole(dto: UpdateMemberRoleDto) {
    const { userId, role } = dto;

    try {
      return this.db.query(
        `UPDATE user_organizations uo SET uo.role_id = $1 WHERE uo.user_id = $2`,
        [role, userId],
      );
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }

  async removeMember(orgId: string, dto: RemoveMemberDto) {
    const { userId } = dto;

    try {
      return this.db.query(
        `
          DELETE FROM user_organizations uo
          WHERE uo.user_id = $1 AND uo.organization_id = $2
      `,
        [userId, orgId],
      );
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
