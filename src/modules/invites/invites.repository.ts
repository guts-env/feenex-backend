import { QueryResult } from 'pg';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { DatabaseService } from '@/database/database.service';
import CreateInviteDto from '@/modules/invites/dto/create-invite.dto';
import { type IRepositoryInvite } from '@/modules/invites/types/invites';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InvitesRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async findByEmail(email: string): Promise<IRepositoryInvite | null> {
    const result: QueryResult<IRepositoryInvite> = await this.db.query(
      `SELECT * FROM invites WHERE email = $1`,
      [email],
    );

    return result.rows[0] || null;
  }

  async findByToken(token: string): Promise<IRepositoryInvite | null> {
    const result: QueryResult<IRepositoryInvite> = await this.db.query(
      `SELECT * FROM invites WHERE token = $1`,
      [token],
    );

    return result.rows[0] || null;
  }

  async createInvite(
    orgId: string,
    userId: string,
    dto: CreateInviteDto,
    token: string,
  ): Promise<IRepositoryInvite> {
    const { email } = dto;

    try {
      const result: QueryResult<IRepositoryInvite> = await this.db.query(
        `
          INSERT INTO invites (organization_id, email, created_by, updated_by, token) 
          VALUES ($1, $2, $3, $3, $4)
          RETURNING *
        `,
        [orgId, email, userId, token],
      );

      return result.rows[0];
    } catch (error: any) {
      this.handleDatabaseError(error);
    }
  }
}
