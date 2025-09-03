import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import { DatabaseService } from '@/database/database.service';
import { IRepositoryOrganization } from '@/modules/organizations/types/organizations';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByUserId(id: string): Promise<IRepositoryOrganization[]> {
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
  }
}
