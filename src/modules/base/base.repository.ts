import { InternalServerErrorException } from '@nestjs/common';

export abstract class BaseRepository {
  protected handleDatabaseError(error: any): never {
    console.error('Database error:', error);
    throw new InternalServerErrorException({
      message: 'Database query failed',
    });
  }
}
