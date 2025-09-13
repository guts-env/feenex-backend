import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';

@Injectable()
export class CategoriesRepository extends BaseRepository {
  async findAll() {
    return this.db.selectFrom('categories').selectAll().execute();
  }
}
