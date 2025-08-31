import { User } from '@/modules/users/types/users';

export interface BaseRepositoryInterface {
  created_at: Date;
  updated_at: Date;
  created_by?: User;
  updated_by?: User;
}
