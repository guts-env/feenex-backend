import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { BaseRepository } from '@/common/modules/base/base.repository';

@Injectable()
export class ReportsRepository extends BaseRepository {
  constructor(private readonly db: DatabaseService) {
    super();
  }
}
