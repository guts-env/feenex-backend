import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Kysely, NoResultError } from 'kysely';
import { DatabaseService } from '@/database/database.service';
import { type DB } from '@/database/types/db';

@Injectable()
export abstract class BaseRepository {
  private readonly logger = new Logger(BaseRepository.name);
  protected _db?: Kysely<DB>;

  constructor(private readonly dbService: DatabaseService) {}

  protected get db(): Kysely<DB> {
    if (!this._db) {
      this._db = this.dbService.trx();
    }
    return this._db;
  }

  protected handleDatabaseError(error: any): never {
    if (error instanceof NoResultError) {
      throw new NotFoundException({ message: 'Record not found' });
    }

    if (this.isDatabaseError(error)) {
      switch (error.code) {
        case '23505':
          throw new ConflictException({ message: 'Record already exists' });
        case '23503':
          throw new BadRequestException({
            message: 'Referenced record does not exist',
          });
        case '23502':
          throw new BadRequestException('Required field is missing');
      }
    }

    this.logger.error('Database error:', error);
    throw new InternalServerErrorException({
      message: 'Database query failed',
    });
  }

  private isDatabaseError(
    error: unknown,
  ): error is { code: string; message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: string }).code === 'string'
    );
  }
}
