import { IBaseRepositoryUser } from '@/modules/users/types/users';

export interface IBaseRepositoryInterface {
  id: string;
  created_at: Date;
  updated_at: Date;
  created_by?: Partial<IBaseRepositoryUser> & Pick<IBaseRepositoryUser, 'id'>;
  updated_by?: Partial<IBaseRepositoryUser> & Pick<IBaseRepositoryUser, 'id'>;
}
