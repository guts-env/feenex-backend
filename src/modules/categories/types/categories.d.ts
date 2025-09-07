import { IBaseRepositoryInterface } from '@/common/modules/base/types/base';

export interface IBaseRepositoryCategory extends IBaseRepositoryInterface {
  name: string;
}

export interface IRepositoryCategory extends IBaseRepositoryCategory {
  organization_id: string;
  description: string;
  is_default: boolean;
}
