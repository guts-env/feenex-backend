import { BaseRepository } from '@/modules/base/base.repository';

export interface CreateUserInput {
  email: string;
  hashed_password: string;
}

export interface User extends BaseRepository {
  id: string;
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
}
