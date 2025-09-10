import { BaseRepository } from '@/common/modules/base/base.repository';
import CreateInviteDto from '@/modules/invites/dto/create-invite.dto';
import { type IRepositoryInvite } from '@/modules/invites/types/invites';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InvitesRepository extends BaseRepository {
  private get baseQuery() {
    return this.db
      .selectFrom('invites as i')
      .innerJoin('users as u', 'i.created_by', 'u.id')
      .innerJoin('users as u2', 'i.updated_by', 'u2.id')
      .select([
        'i.id',
        'i.email',
        'i.organization_id',
        'i.role_id',
        'i.expires_at',
        'i.token',
        'i.used',
        'i.used_at',
        'i.created_at',
        'i.updated_at',
        'u.id as created_by',
        'u.first_name as created_by_first_name',
        'u.last_name as created_by_last_name',
        'u.middle_name as created_by_middle_name',
        'u2.id as updated_by',
        'u2.first_name as updated_by_first_name',
        'u2.last_name as updated_by_last_name',
        'u2.middle_name as updated_by_middle_name',
      ]);
  }

  async findByEmail(email: string): Promise<IRepositoryInvite | undefined> {
    try {
      const result = await this.baseQuery
        .where('i.email', '=', email)
        .executeTakeFirst();

      const transformedResult = result
        ? {
            ...result,
            created_by: {
              id: result.created_by,
              first_name: result.created_by_first_name,
              last_name: result.created_by_last_name,
              middle_name: result.created_by_middle_name,
            },
            updated_by: {
              id: result.updated_by,
              first_name: result.updated_by_first_name,
              last_name: result.updated_by_last_name,
              middle_name: result.updated_by_middle_name,
            },
          }
        : undefined;

      return transformedResult;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findByToken(token: string): Promise<IRepositoryInvite | undefined> {
    try {
      const result = await this.baseQuery
        .where('token', '=', token)
        .executeTakeFirst();

      const transformedResult = result
        ? {
            ...result,
            created_by: {
              id: result.created_by,
              first_name: result.created_by_first_name,
              last_name: result.created_by_last_name,
              middle_name: result.created_by_middle_name,
            },
            updated_by: {
              id: result.updated_by,
              first_name: result.updated_by_first_name,
              last_name: result.updated_by_last_name,
              middle_name: result.updated_by_middle_name,
            },
          }
        : undefined;

      return transformedResult;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async createInvite(
    orgId: string,
    userId: string,
    dto: CreateInviteDto,
    token: string,
  ): Promise<void> {
    const { email } = dto;

    try {
      await this.db
        .insertInto('invites')
        .values({
          organization_id: orgId,
          email,
          created_by: userId,
          updated_by: userId,
          token,
        })
        .executeTakeFirstOrThrow();
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
