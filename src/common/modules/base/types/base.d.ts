import { IBaseRepositoryUser } from '@/modules/users/types/users';

export interface IBaseRepositoryInterface {
  id: string;
  created_at: Date;
  updated_at: Date;
  created_by?: Omit<
    IBaseRepositoryUser,
    'created_at' | 'updated_at' | 'created_by' | 'updated_by'
  >;
  updated_by?: Omit<
    IBaseRepositoryUser,
    'created_at' | 'updated_at' | 'created_by' | 'updated_by'
  >;
}
